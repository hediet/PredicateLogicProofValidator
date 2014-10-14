module FirstOrderPredicateLogic.Parser {


    export class DocumentParser {

        private formulaParser: FormulaParser;
        private termParser: TermParser;
        private supportedConditions: Proof.Condition[];

        constructor(formulaParser: FormulaParser, termParser: TermParser, supportedConditions: Proof.Condition[]) {
            this.formulaParser = formulaParser;
            this.termParser = termParser;
            this.supportedConditions = supportedConditions;
        }

        public parseStr(str: string, logger: ParserLogger): Proof.Document {
            Common.ArgumentExceptionHelper.ensureTypeOf(str, "string", "str");

            var t = new Tokenizer(str);
            return this.parse(t, logger);
        }

        public parse(tokenizer: Tokenizer, logger: ParserLogger): Proof.Document {
            Common.ArgumentExceptionHelper.ensureTypeOf(tokenizer, Tokenizer, "tokenizer");

            var descriptions: Proof.Description[] = [];
            var globalSymbols: Syntax.Declaration[] = [];

            parserHelper.parseWhitespace(tokenizer);

            var first = true;

            while (tokenizer.peek() !== "") {
                var start = tokenizer.getPosition();
                var identifier = parserHelper.parseIdentifier(tokenizer);

                var availableDescriptions: { [id: string]: () => Proof.Description } = {
                    "Axiom": () => this.parseAxiom(tokenizer, logger, globalSymbols),
                    "Rule": () => this.parseRule(tokenizer, logger, globalSymbols),
                    "Theorem": () => this.parseTheorem(tokenizer, logger, globalSymbols),
                    "Hypothesis": () => new Proof.CustomAxiomDescription(new Proof.HypothesisAxiom()),
                    "Deduction": () => new Proof.CustomRuleDescription(new Proof.DeductionRule())
                };

                var parseFunction = identifier === null ? undefined : availableDescriptions[identifier.getIdentifier()];

                if (typeof parseFunction === "undefined") {

                    if (identifier !== null && identifier.getIdentifier() === "GlobalSymbols") {
                        if (!first)
                            logger.logError("Global symbols must be defined first", TextRegion.getRegionOf(identifier));
                        else {
                            parserHelper.parseWhitespace(tokenizer);
                            this.expect(tokenizer, logger, "{");
                            globalSymbols = this.parseSymbols(tokenizer, logger, []);
                            parserHelper.parseWhitespace(tokenizer);
                            this.expect(tokenizer, logger, "}");
                        }
                    } else {
                        var butGot: string;
                        if (identifier === null)
                            butGot = tokenizer.readWhile(c => (parserHelper.whitespace.indexOf(c) === -1) && (parserHelper.letters.indexOf(c) === -1));
                        else
                            butGot = identifier.getIdentifier();

                        logger.logError("Expected a type identifier, but got '" + butGot + "'", tokenizer.getRegion(start));
                    }
                } else {
                    var description = parseFunction();
                    TextRegion.setRegionTo(description, tokenizer.getRegion(start));
                    descriptions.push(description);
                }

                parserHelper.parseWhitespace(tokenizer);

                first = false;
            }

            return new Proof.Document(descriptions);
        }


        private expect(t: Tokenizer, l: ParserLogger, text: string) {
            if (!t.tryRead(text)) {
                l.logError("Expected '" + text + "'", t.getRegion(t.getPosition()));
            }
        }

        private parseSection(t: Tokenizer, l: ParserLogger, availableSections: { [id: string]: (sectionTextRegion: TextRegion) => void }) {

            this.expect(t, l, "{");

            parserHelper.parseWhitespace(t);

            while (t.peek() !== "" && t.peek() !== "}") {

                var s = this.readNextSection(t, l);

                if (s === null) {
                    var butGotStart = t.getPosition();
                    var butGot = t.readWhile(c => parserHelper.letters.indexOf(c) === -1
                        && c !== "}" && parserHelper.whitespace.indexOf(c) === -1);
                    l.logError("Expected a section or '}', but got '" + butGot + "'", t.getRegion(butGotStart));
                    continue;
                }

                var sectionParseFunction = availableSections[s.getIdentifier()];

                if (typeof sectionParseFunction === "undefined") {
                    l.logError("Unknown section '" + s.getIdentifier() + "'", TextRegion.getRegionOf(s));
                }
                else
                    sectionParseFunction(TextRegion.getRegionOf(s));

                parserHelper.parseWhitespace(t);
            }

            this.expect(t, l, "}");
        }

        private emptyArrayIfNull<T>(arr: T[]): T[] {
            if (arr === null)
                return [];
            return arr;
        }

        private parseAxiom(t: Tokenizer, l: ParserLogger, globalSymbols: Syntax.Declaration[]): Proof.AxiomDescription {

            parserHelper.parseWhitespace(t);

            var declarations: Syntax.Declaration[] = null;
            var assertion: Syntax.Formula = null;
            var conditions: Proof.AppliedCondition[] = null;
            var name = parserHelper.parseIdentifier(t);

            if (name === null) {
                l.logError("Axiom must have a name", t.getRegion(t.getPosition()));
            }

            parserHelper.parseWhitespace(t);

            var availableSections: { [id: string]: (t: TextRegion) => void } = {
                "Symbols": (sectionRegion) => {
                    declarations = this.parseSymbols(t, l, globalSymbols);
                    if (conditions !== null || assertion !== null) {
                        l.logError("Symbols must be defined first", sectionRegion);
                    }
                },
                "Assertion": () => {
                    parserHelper.parseWhitespace(t);
                    t.tryRead("|-");
                    var context = new Parser.ParserContext(globalSymbols, declarations);
                    assertion = this.formulaParser.parseFormula(t, context, l);
                },
                "Conditions": (sectionRegion) => {
                    var context = new Parser.ParserContext(globalSymbols, declarations);
                    conditions = this.parseConditions(t, context, l);
                    if (assertion !== null) {
                        l.logError("Conditions must be defined before the assertion", sectionRegion);
                    }
                }
            };

            this.parseSection(t, l, availableSections);

            return new Proof.AxiomDescription(name, this.emptyArrayIfNull(declarations),
                assertion, this.emptyArrayIfNull(conditions));
        }


        private parseRule(t: Tokenizer, l: ParserLogger, globalSymbols: Syntax.Declaration[]): Proof.RuleDescription {
            parserHelper.parseWhitespace(t);

            var declarations: Syntax.Declaration[] = null;
            var conclusion: Syntax.Formula = null;
            var assumptions: Syntax.Formula[] = null;
            var conditions: Proof.AppliedCondition[] = null;
            var name = parserHelper.parseIdentifier(t);

            if (name === null) {
                l.logError("Rule must have a name", t.getRegion(t.getPosition()));
            }

            parserHelper.parseWhitespace(t);

            var availableSections: { [id: string]: (region: TextRegion) => void } = {
                "Symbols": (sectionRegion) => {
                    declarations = this.parseSymbols(t, l, globalSymbols);
                    if (conditions !== null || conclusion !== null || assumptions !== null) {
                        l.logError("Symbols must be defined first", sectionRegion);
                    }
                },
                "Conditions": (sectionRegion) => {
                    var context = new Parser.ParserContext(globalSymbols, declarations);
                    conditions = this.parseConditions(t, context, l);
                    if (conclusion !== null && assumptions !== null) {
                        l.logError("Conditions must be defined before assumptions or the conclusion",
                            sectionRegion);
                    }
                },
                "Assumptions": (sectionRegion) => {
                    parserHelper.parseWhitespace(t);

                    assumptions = [];

                    while (t.tryRead("|-")) {

                        parserHelper.parseWhitespace(t);
                        var context = new Parser.ParserContext(globalSymbols, declarations);
                        var assumption = this.formulaParser.parseFormula(t, context, l);
                        assumptions.push(assumption);

                        parserHelper.parseWhitespace(t);
                    }
                    if (conclusion !== null) {
                        l.logError("Assumptions must be defined before the conclusion",
                            sectionRegion);
                    }
                },
                "Conclusion": () => {
                    parserHelper.parseWhitespace(t);
                    this.expect(t, l, "|-");
                    var context = new Parser.ParserContext(globalSymbols, declarations);
                    conclusion = this.formulaParser.parseFormula(t, context, l);
                }
            };

            this.parseSection(t, l, availableSections);

            return new Proof.RuleDescription(name, this.emptyArrayIfNull(declarations),
                this.emptyArrayIfNull(assumptions),
                conclusion, this.emptyArrayIfNull(conditions));
        }

        private parseTheorem(t: Tokenizer, l: ParserLogger, globalSymbols: Syntax.Declaration[]): Proof.TheoremDescription {

            parserHelper.parseWhitespace(t);

            var name: Proof.IdentifierElement = null;
            var declarations: Syntax.Declaration[] = null;
            var assertion: Syntax.Formula = null;
            var steps: Proof.DocumentStep[] = null;
            var conditions: Proof.AppliedCondition[] = null;

            if (t.peek() !== "{") {
                name = parserHelper.parseIdentifier(t);
                parserHelper.parseWhitespace(t);
            }

            var availableSections: { [id: string]: (region: TextRegion) => void } = {
                "Symbols": (sectionRegion) => {
                    declarations = this.parseSymbols(t, l, globalSymbols);
                    if (conditions !== null || steps !== null || assertion !== null) {
                        l.logError("Symbols must be defined first", sectionRegion);
                    }
                },
                "Conditions": (sectionRegion) => {
                    var context = new Parser.ParserContext(globalSymbols, declarations);
                    conditions = this.parseConditions(t, context, l);
                    if (steps !== null && assertion !== null) {
                        l.logError("Conditions must be defined before the assertions or the proof",
                            sectionRegion);
                    }
                },
                "Assertion": (sectionRegion) => {
                    parserHelper.parseWhitespace(t);
                    this.expect(t, l, "|-");
                    var context = new Parser.ParserContext(globalSymbols, declarations);
                    assertion = this.formulaParser.parseFormula(t, context, l);

                    if (steps !== null) {
                        l.logError("Assertion must be defined before the proof", sectionRegion);
                    }
                },
                "Proof": () => {
                    parserHelper.parseWhitespace(t);

                    steps = [];

                    while (t.peek() !== "") {

                        var context = new Parser.ParserContext(globalSymbols, declarations);
                        var step = this.parseProofStep(t, context, l);

                        if (step === null)
                            break;
                        steps.push(step);
                    }
                }
            };

            this.parseSection(t, l, availableSections);

            return new Proof.TheoremDescription(name,
                this.emptyArrayIfNull(declarations), assertion,
                this.emptyArrayIfNull(steps), this.emptyArrayIfNull(conditions));
        }


        private parseProofStep(t: Tokenizer, context: IParserContext, l: ParserLogger): Proof.DocumentStep {

            parserHelper.parseWhitespace(t);

            var start = t.getPosition();

            if (!t.tryRead("#"))
                return null;

            parserHelper.parseWhitespace(t);

            var stepIdent = parserHelper.parseIdentifier(t, false);
            if (stepIdent === null) {
                l.logError("Each step must have an identifier", t.getRegion(start));
            }

            this.expect(t, l, ".");

            parserHelper.parseWhitespace(t);
            var operation = parserHelper.parseIdentifier(t);

            var args: any[] = [];

            parserHelper.parseWhitespace(t);
            if (t.tryRead("(")) {

                parserHelper.parseWhitespace(t);
                var first = true;
                while (t.peek() !== "" && t.peek() !== ")") {

                    if (!first) {
                        parserHelper.parseWhitespace(t);
                        if (!t.tryRead(","))
                            break;
                    } else {
                        first = false;
                    }

                    parserHelper.parseWhitespace(t);

                    var argument: any;

                    if (t.tryRead("@")) {
                        var ref = parserHelper.parseIdentifier(t, false);
                        argument = new Proof.StepRef(ref);

                    } else {
                        argument = this.parseNode(t, context, l);
                    }

                    args.push(argument);

                    parserHelper.parseWhitespace(t);
                }

                this.expect(t, l, ")");
            }

            var step = new Proof.DocumentStep(stepIdent, operation, args);
            TextRegion.setRegionTo(step, t.getRegion(start));

            return step;
        }


        private parseConditions(t: Tokenizer, context: IParserContext, l: ParserLogger): Proof.AppliedCondition[] {

            var result: Proof.AppliedCondition[] = [];

            parserHelper.parseWhitespace(t);

            while (t.peek() !== "") {

                var startPos = t.getPosition();
                parserHelper.parseIdentifier(t);
                if (t.tryRead(":")) {
                    t.gotoPosition(startPos);
                    break;
                }
                t.gotoPosition(startPos);

                var args: Syntax.Node[] = [];
                var words: string[] = [];

                while (t.peek() !== "" && t.peek() !== ".") {

                    parserHelper.parseWhitespace(t);

                    if (t.tryRead("{")) {
                        parserHelper.parseWhitespace(t);
                        var arg2: Syntax.Node[] = [];
                        var first = true;
                        while (t.peek() !== "" && t.peek() !== "}") {
                            if (!first) {
                                if (!t.tryRead(","))
                                    t.read();
                                parserHelper.parseWhitespace(t);
                            } else
                                first = false;

                            var node = this.parseNode(t, context, l);
                            arg2.push(node);
                            parserHelper.parseWhitespace(t);
                        }
                        args.push(new Syntax.NodeArray(arg2));
                        words.push("?");
                        t.tryRead("}");
                    }
                    else if (["<", "[", "("].indexOf(t.peek()) !== -1) {
                        var arg = this.parseNode(t, context, l);
                        args.push(arg);
                        words.push("?");
                    } else {

                        var ident = parserHelper.parseIdentifier(t);
                        if (ident === null)
                            t.read();
                        else {
                            words.push(ident.getIdentifier());
                        }
                    }
                }

                this.expect(t, l, ".");

                var sentence = words.join(" ");

                var condition = Common.firstOrDefault(this.supportedConditions, null, c => c.getTemplate() === sentence ? c : null);

                var region = t.getRegion(startPos);

                if (condition === null) {
                    var min = Infinity;
                    var didYouMean: Proof.Condition;
                    this.supportedConditions.forEach(c => {
                        var d = Common.getEditDistance(sentence, c.getTemplate());
                        if (d < min) {
                            min = d;
                            didYouMean = c;
                        }
                    });
                    

                    l.logError("Condition not found, did you mean '" + didYouMean.getTemplate() + "'", region);
                } else {
                    var cancel = false;
                    condition.getParameterTypes().forEach((type, idx) => {
                        var arg = args[idx];

                        if (arg == null) {
                            l.logError("Argument '" + idx + "' is not defined", region);
                            cancel = true;
                        }
                        else if (type instanceof Common.ArrayType) {
                            var arrType = <Common.ArrayType>type; //TODO write recursive check function or enhance the type system
                            if (!(arg instanceof Syntax.NodeArray)) {
                                l.logError("Argument must be an array", TextRegion.getRegionOf(arg));
                                cancel = true;
                            }
                            var arr = <Syntax.NodeArray>arg;
                            arr.getItems().forEach(element => {
                                if (element == null) {
                                    l.logError("Argument '" + idx + "' is not defined", region);
                                    cancel = true;
                                }
                                else if (!(element instanceof arrType.getItemType())) {
                                    l.logError("Argument must be type of '" + arrType.getItemType() + "'", TextRegion.getRegionOf(element));
                                    cancel = true;
                                }
                            });
                        } else {
                            if (!(arg instanceof type)) {
                                l.logError("Argument must be type of '" + type + "'", TextRegion.getRegionOf(arg));
                                cancel = true;
                            }
                        }
                    });
                    if (!cancel) {
                        var appliedCondition = new Proof.AppliedCondition(condition, args);
                        TextRegion.setRegionTo(appliedCondition, region);
                        result.push(appliedCondition);
                    }
                }

                parserHelper.parseWhitespace(t);
            }

            return result;
        }

        private parseNode(t: Tokenizer, context: IParserContext, l: ParserLogger): Syntax.Node {

            if (t.tryRead("<")) {

                parserHelper.parseWhitespace(t);

                var result: Syntax.Node = null;

                var identifier = parserHelper.parseIdentifier(t);
                if (identifier === null) {
                    l.logError("Expected identifier", t.getRegion(t.getPosition()));
                } else {
                    var identValue = identifier.getIdentifier();
                    var elements: Syntax.Node[] = [
                        context.getFormulaDeclaration(identValue), context.getFunctionDeclaration(identValue),
                        context.getPredicateDeclaration(identValue), context.getTermDeclaration(identValue),
                        context.getVariableDeclaration(identValue)
                    ];

                    result = Common.firstOrDefault(elements, null, e => e);

                    parserHelper.parseWhitespace(t);
                }
                this.expect(t, l, ">");

                return result;
            }
            else if (t.tryRead("[")) {
                parserHelper.parseWhitespace(t);
                var result2 = this.termParser.parseTerm(t, context, l);
                parserHelper.parseWhitespace(t);
                this.expect(t, l, "]");
                return result2;
            }

            return this.formulaParser.parseFormula(t, context, l);
        }

        private parseSymbols(t: Tokenizer, l: ParserLogger, globalSymbols: Syntax.Declaration[]): Syntax.Declaration[] {

            parserHelper.parseWhitespace(t);

            var result: Syntax.Declaration[] = [];

            while (t.peek() !== "" && t.peek() !== "}") {

                var symbols: { identifier: Proof.IdentifierElement; arity: number }[] = [];

                var p = t.getPosition();
                var ident = parserHelper.parseIdentifier(t);
                if (t.peek() === ":") {
                    t.gotoPosition(p);
                    break;
                }
                if (ident === null) {
                    l.logError("Expected 'Let', but got nothing.", t.getRegion(t.getPosition()));
                    break;
                }

                t.gotoPosition(p);

                this.expect(t, l, "Let");

                var first = true;

                while (t.peek() !== "" && t.peek() !== "}") {
                    parserHelper.parseWhitespace(t);
                    if (!first) {
                        if (!t.tryRead(","))
                            break;
                        parserHelper.parseWhitespace(t);
                    } else
                        first = false;

                    var ident = parserHelper.parseIdentifier(t, false);
                    parserHelper.parseWhitespace(t);

                    var arity: number = null;
                    if (t.tryRead("(")) {
                        parserHelper.parseWhitespace(t);
                        arity = parseInt(t.readWhile(c => parserHelper.numbers.indexOf(c) !== -1));
                        this.expect(t, l, ")");
                    }

                    symbols.push({ identifier: ident, arity: arity });
                }

                parserHelper.parseWhitespace(t);
                this.expect(t, l, "be");
                parserHelper.parseWhitespace(t);

                var identifier: Proof.IdentifierElement = null;
                var strIdentifier: string = null;

                if (symbols.length === 1) {
                    t.tryRead("a");
                    parserHelper.parseWhitespace(t);
                    identifier = parserHelper.parseIdentifier(t);
                    if (identifier !== null)
                        strIdentifier = identifier.getIdentifier();

                } else {
                    identifier = parserHelper.parseIdentifier(t);
                    //remove the trailing "s"
                    if (identifier !== null) {
                        strIdentifier = identifier.getIdentifier();
                        if (strIdentifier[strIdentifier.length - 1] === "s")
                            strIdentifier = strIdentifier.substr(0, strIdentifier.length - 1);
                    }
                }

                var declarations: { [id: string]: (s: { identifier: Proof.IdentifierElement; arity: number }) => Syntax.Declaration } = {
                    "formula": s => new Syntax.FormulaDeclaration(s.identifier.getIdentifier()),
                    "variable": s => new Syntax.VariableDeclaration(s.identifier.getIdentifier()),
                    "function": s => {
                        if (s.arity === null) {
                            l.logError("The function '" + s.identifier.getIdentifier() + "' must specify how many arguments it take, e.g. '"
                                + s.identifier.getIdentifier() + "(1)' for taking one argument", TextRegion.getRegionOf(s.identifier));
                        }
                        return new Syntax.FunctionDeclaration(s.identifier.getIdentifier(), s.arity);
                    },
                    "predicate": s => {
                        if (s.arity === null) {
                            l.logError("The predicate '" + s.identifier.getIdentifier() + "' must specify how many arguments it take, e.g. '"
                                + s.identifier.getIdentifier() + "(1)' for taking one argument", TextRegion.getRegionOf(s.identifier));
                        }
                        return new Syntax.PredicateDeclaration(s.identifier.getIdentifier(), s.arity);
                    },
                    "term": s => new Syntax.TermDeclaration(s.identifier.getIdentifier())
                };

                if (strIdentifier === null) {
                    l.logError("Type identifier expected type", t.getRegion(t.getPosition()));
                }
                else if (typeof declarations[strIdentifier] === "undefined") {
                    l.logError("Unknown type", TextRegion.getRegionOf(identifier));
                } else {
                    symbols.forEach(s => {
                        var decl = declarations[strIdentifier](s);
                        TextRegion.setRegionTo(decl, TextRegion.getRegionOf(s.identifier));
                        result.push(decl);
                    });
                }

                parserHelper.parseWhitespace(t);
                this.expect(t, l, ".");
                parserHelper.parseWhitespace(t);
            }

            var actualResult: Syntax.Declaration[] = [];
             
            result.forEach(d => {
                if (globalSymbols.some(s => s.equals(d))) {
                    l.logError("'" + d.getName() + "' was already declared", TextRegion.getRegionOf(d));
                } else
                    actualResult.push(d);
            });

            return actualResult;
        }


        private readNextSection(t: Tokenizer, l: ParserLogger): Proof.IdentifierElement {
            parserHelper.parseWhitespace(t);
            var name = parserHelper.parseIdentifier(t);
            if (name !== null)
                this.expect(t, l, ":");

            return name;
        }
    }
}
