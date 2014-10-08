module FirstOrderPredicateLogic.Parser {


    export class DocumentParser {

        private formulaParser: FormulaParser;
        private termParser: TermParser;
        private supportedConditions: Proof.ICondition[];

        constructor(formulaParser: FormulaParser, termParser: TermParser, supportedConditions: Proof.ICondition[]) {
            this.formulaParser = formulaParser;
            this.termParser = termParser;
            this.supportedConditions = supportedConditions;
        }

        public parseStr(str: string): Proof.Document {
            Common.ArgumentExceptionHelper.ensureTypeOf(str, "string", "str");

            var t = new Tokenizer(str);
            return this.parse(t);
        }

        public parse(tokenizer: Tokenizer): Proof.Document {
            Common.ArgumentExceptionHelper.ensureTypeOf(tokenizer, Tokenizer, "tokenizer");

            var descriptions: Proof.Description[] = [];

            while (tokenizer.peek() !== "") {
                parserHelper.parseWhitespace(tokenizer);

                var identifier = parserHelper.parseIdentifier(tokenizer);

                var description: Proof.Description = null;

                var start = tokenizer.getPosition();

                if (identifier === "Axiom") {
                    description = this.parseAxiom(tokenizer);
                }
                else if (identifier === "Theorem") {
                    description = this.parseTheorem(tokenizer);
                }
                else if (identifier === "Rule") {
                    description = this.parseRule(tokenizer);
                }
                else if (identifier === "Hypothesis") {
                    description = new Proof.CustomAxiomDescription(new Proof.HypothesisAxiom());
                }
                else if (identifier === "Deduction") {
                    description = new Proof.CustomRuleDescription(new Proof.DeductionRule());
                }

                if (description !== null) {
                    TextRegion.setRegionTo(description, tokenizer.getRegion(start));
                    descriptions.push(description);
                }
            }

            return new Proof.Document(descriptions);
        }





        private parseRule(t: Tokenizer): Proof.RuleDescription {
            parserHelper.parseWhitespace(t);

            var declarations: Syntax.Declaration[] = [];
            var conclusion: Syntax.Formula = null;
            var assumptions: Syntax.Formula[] = [];
            var conditions: Proof.AppliedCondition[] = [];

            var name = parserHelper.parseIdentifier(t);
            parserHelper.parseWhitespace(t);


            t.tryRead("{");
            parserHelper.parseWhitespace(t);

            while (t.peek() !== "" && t.peek() !== "}") {

                var s = this.readNextSection(t);

                if (s === null) {
                    t.readWhile(c => parserHelper.letters.indexOf(c) === -1);
                    continue;
                }

                if (s === "Symbols") {
                    declarations = this.parseSymbols(t);
                }
                else if (s === "Conclusion") {
                    parserHelper.parseWhitespace(t);
                    t.tryRead("|-");
                    var context = new Parser.ParserContext(declarations);

                    var start = t.getPosition();
                    conclusion = this.formulaParser.parseFormula(t, context);
                    TextRegion.setRegionTo(conclusion, t.getRegion(start));
                }
                else if (s === "Assumptions") {
                    parserHelper.parseWhitespace(t);

                    while (t.tryRead("|-")) {

                        parserHelper.parseWhitespace(t);
                        var context = new Parser.ParserContext(declarations);
                        var assumption = this.formulaParser.parseFormula(t, context);
                        assumptions.push(assumption);

                        parserHelper.parseWhitespace(t);
                    }
                }
                else if (s === "Conditions") {
                    conditions = this.parseConditions(t, context);
                } else break;

                parserHelper.parseWhitespace(t);
            }

            t.tryRead("}");

            return new Proof.RuleDescription(name, declarations, assumptions, conclusion, conditions);
        }

        private parseTheorem(t: Tokenizer): Proof.TheoremDescription {

            parserHelper.parseWhitespace(t);

            var name = null;
            var declarations: Syntax.Declaration[] = [];
            var assertion: Syntax.Formula = null;
            var steps: Proof.ProofStep[] = [];
            var conditions: Proof.AppliedCondition[] = [];

            if (t.peek() !== "{") {
                name = parserHelper.parseIdentifier(t);
                parserHelper.parseWhitespace(t);
            }

            t.tryRead("{");
            parserHelper.parseWhitespace(t);

            while (t.peek() !== "" && t.peek() !== "}") {

                var s = this.readNextSection(t);

                if (s === null) {
                    t.readWhile(c => parserHelper.letters.indexOf(c) === -1);
                    continue;
                }

                if (s === "Symbols") {
                    declarations = this.parseSymbols(t);
                }
                else if (s === "Assertion") {
                    parserHelper.parseWhitespace(t);
                    t.tryRead("|-");
                    var context = new Parser.ParserContext(declarations);

                    var start = t.getPosition();
                    assertion = this.formulaParser.parseFormula(t, context);
                    TextRegion.setRegionTo(assertion, t.getRegion(start));
                }
                else if (s === "Proof") {
                    parserHelper.parseWhitespace(t);

                    while (t.peek() !== "") {

                        var context = new Parser.ParserContext(declarations);
                        var step = this.parseProofStep(t, context);

                        if (step === null)
                            break;
                        steps.push(step);
                    }
                }
                else if (s === "Conditions") {
                    var context = new Parser.ParserContext(declarations);
                    conditions = this.parseConditions(t, context);
                }

                parserHelper.parseWhitespace(t);
            }

            t.tryRead("}");

            return new Proof.TheoremDescription(name, declarations, assertion, steps, conditions);
        }


        private parseProofStep(t: Tokenizer, context: IParserContext): Proof.ProofStep {

            parserHelper.parseWhitespace(t);

            var start = t.getPosition();

            if (!t.tryRead("#"))
                return null;

            parserHelper.parseWhitespace(t);

            var stepIdent = t.readWhile(c => parserHelper.lettersAndNumbers.indexOf(c) !== -1);

            t.tryRead(".");

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

                    var argument: any = null;

                    if (t.tryRead("@")) {
                        var ref = t.readWhile(c => parserHelper.lettersAndNumbers.indexOf(c) !== -1);
                        argument = new Proof.StepRef(ref);

                    } else {
                        argument = this.parseNode(t, context);
                    }

                    args.push(argument);

                    parserHelper.parseWhitespace(t);
                }


                t.tryRead(")");
            }

            var step = new Proof.ProofStep(stepIdent, operation, args);
            TextRegion.setRegionTo(step, t.getRegion(start));

            return step;
        }


        private parseAxiom(t: Tokenizer): Proof.AxiomDescription {

            parserHelper.parseWhitespace(t);

            var name = null;
            var declarations: Syntax.Declaration[] = [];
            var assertion: Syntax.Formula = null;
            var conditions: Proof.AppliedCondition[] = [];

            if (t.peek() !== "{") {
                name = parserHelper.parseIdentifier(t);
                parserHelper.parseWhitespace(t);
            }

            t.tryRead("{");
            parserHelper.parseWhitespace(t);

            while (t.peek() !== "" && t.peek() !== "}") {

                var s = this.readNextSection(t);

                if (s === null) {
                    t.readWhile(c => parserHelper.letters.indexOf(c) === -1);
                    continue;
                }

                if (s === "Symbols") {
                    declarations = this.parseSymbols(t);
                }
                else if (s === "Assertion") {
                    parserHelper.parseWhitespace(t);
                    t.tryRead("|-");
                    var context = new Parser.ParserContext(declarations);

                    var start = t.getPosition();
                    assertion = this.formulaParser.parseFormula(t, context);
                    var region = t.getRegion(start);
                    (<any>assertion).getTextRegion = () => region;
                }
                else if (s === "Conditions") {
                    var context = new Parser.ParserContext(declarations);
                    conditions = this.parseConditions(t, context);
                }

                parserHelper.parseWhitespace(t);
            }

            t.tryRead("}");

            return new Proof.AxiomDescription(name, declarations, assertion, conditions);
        }


        private parseConditions(t: Tokenizer, context: IParserContext): Proof.AppliedCondition[] {

            var result: Proof.AppliedCondition[] = [];

            while (t.peek() !== "") {

                var p = t.getPosition();
                parserHelper.parseIdentifier(t);
                if (t.tryRead(":")) {
                    t.gotoPosition(p);
                    break;
                }
                t.gotoPosition(p);

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

                            var node = this.parseNode(t, context);
                            arg2.push(node);
                            parserHelper.parseWhitespace(t);
                        }
                        args.push(new Syntax.NodeArray(arg2));
                        words.push("?");
                        t.tryRead("}");
                    }
                    else if (["<", "[", "("].indexOf(t.peek()) !== -1) {
                        var arg = this.parseNode(t, context);
                        args.push(arg);
                        words.push("?");
                    } else {

                        var ident = parserHelper.parseIdentifier(t);
                        if (ident === null)
                            t.read();
                        else {
                            words.push(ident);
                        }
                    }
                }

                var sentence = words.join(" ");

                var condition = Common.firstOrDefault(this.supportedConditions, null, c => c.getTemplate() === sentence ? c : null);

                if (condition === null)
                    throw "Condition not found";

                result.push(new Proof.AppliedCondition(condition, args));

                t.tryRead(".");
                parserHelper.parseWhitespace(t);
            }


            return result;
        }

        private parseNode(t: Tokenizer, context: IParserContext): Syntax.Node {

            if (t.tryRead("<")) {

                parserHelper.parseWhitespace(t);

                var ident = parserHelper.parseIdentifier(t);
                var elements: Syntax.Node[] = [
                    context.getFormulaDeclaration(ident), context.getFunctionDeclaration(ident),
                    context.getPredicateDeclaration(ident), context.getTermDeclaration(ident),
                    context.getVariableDeclaration(ident)
                ];

                var result = Common.firstOrDefault(elements, null, e => e);

                parserHelper.parseWhitespace(t);
                t.tryRead(">");

                return result;
            }
            else if (t.tryRead("[")) {
                parserHelper.parseWhitespace(t);

                var result2 = this.termParser.parseTerm(t, context);

                parserHelper.parseWhitespace(t);
                t.tryRead("]");

                return result2;
            }

            return this.formulaParser.parseFormula(t, context);
        }

        private parseSymbols(tokenizer: Tokenizer): Syntax.Declaration[] {

            parserHelper.parseWhitespace(tokenizer);

            var result: Syntax.Declaration[] = [];

            while (tokenizer.peek() !== "") {

                var symbols: string[] = [];

                var p = tokenizer.getPosition();
                var identifier = parserHelper.parseIdentifier(tokenizer);
                if (tokenizer.peek() === ":") {
                    tokenizer.gotoPosition(p);
                    break;
                }

                //assert identifier == "let"

                var first = true;

                while (tokenizer.peek() !== "" && tokenizer.peek() !== "}") {
                    parserHelper.parseWhitespace(tokenizer);
                    if (!first) {
                        if (!tokenizer.tryRead(","))
                            break;
                        parserHelper.parseWhitespace(tokenizer);
                    } else
                        first = false;

                    var identifier = parserHelper.parseIdentifier(tokenizer);
                    symbols.push(identifier);
                }

                parserHelper.parseWhitespace(tokenizer);
                tokenizer.tryRead("be");
                parserHelper.parseWhitespace(tokenizer);

                var identifier: string = null;

                if (symbols.length === 1) {
                    tokenizer.tryRead("a");
                    parserHelper.parseWhitespace(tokenizer);
                    identifier = parserHelper.parseIdentifier(tokenizer);

                } else {
                    identifier = parserHelper.parseIdentifier(tokenizer);
                    //remove the trailing "s"
                    identifier = identifier.substr(0, identifier.length - 1);
                }

                if (identifier === "formula")
                    symbols.forEach(s => result.push(new Syntax.FormulaDeclaration(s)));
                else if (identifier === "variable")
                    symbols.forEach(s => result.push(new Syntax.VariableDeclaration(s)));
                else if (identifier === "function")
                    symbols.forEach(s => result.push(new Syntax.FunctionDeclaration(s, 1)));
                else if (identifier === "predicate")
                    symbols.forEach(s => result.push(new Syntax.PredicateDeclaration(s, 1)));
                else if (identifier === "term")
                    symbols.forEach(s => result.push(new Syntax.TermDeclaration(s)));
                else
                    break;

                parserHelper.parseWhitespace(tokenizer);
                tokenizer.tryRead(".");
                parserHelper.parseWhitespace(tokenizer);
            }

            return result;
        }


        private readNextSection(tokenizer: Tokenizer): string {
            parserHelper.parseWhitespace(tokenizer);
            var name = parserHelper.parseIdentifier(tokenizer);
            tokenizer.tryRead(":");

            return name;
        }
    }
}
