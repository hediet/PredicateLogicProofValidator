module FirstOrderPredicateLogic.Parser {


    export class DocumentParser {

        private formulaParser: FormulaParser;
        private termParser: TermParser;

        constructor(formulaParser: FormulaParser, termParser: TermParser) {
            this.formulaParser = formulaParser;
            this.termParser = termParser;
        }

        public parseStr(str: string): Proof.Document {
            Helper.ArgumentExceptionHelper.ensureTypeOf(str, "string", "str");

            var t = new Tokenizer(str);
            return this.parse(t);
        }
        
        public parse(tokenizer: Tokenizer): Proof.Document {
            Helper.ArgumentExceptionHelper.ensureTypeOf(tokenizer, Tokenizer, "tokenizer");

            var descriptions: Proof.Description[] = [];

            while (tokenizer.peek() !== "") {
                parserHelper.parseWhitespace(tokenizer);

                var identifier = parserHelper.parseIdentifier(tokenizer);

                if (identifier === "Axiom") {
                    descriptions.push(this.parseAxiom(tokenizer));
                }
                else if (identifier === "Theorem") {
                    descriptions.push(this.parseTheorem(tokenizer));
                }
                else if (identifier === "Rule") {
                    descriptions.push(this.parseRule(tokenizer));
                }
            }

            return new Proof.Document(descriptions);
        }





        private parseRule(t: Tokenizer): Proof.RuleDescription {
            parserHelper.parseWhitespace(t);

            var name = null;
            var declarations: Syntax.Declaration[] = [];
            var conclusion: Syntax.Formula = null;
            var assumptions: Syntax.Formula[] = [];


            name = parserHelper.parseIdentifier(t);
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


                parserHelper.parseWhitespace(t);
            }

            t.tryRead("}");

            return new Proof.RuleDescription(name, declarations, assumptions, conclusion);
        }

        private parseTheorem(t: Tokenizer): Proof.TheoremDescription {

            parserHelper.parseWhitespace(t);

            var name = null;
            var declarations: Syntax.Declaration[] = [];
            var assertion: Syntax.Formula = null;
            var steps: Proof.ProofStep[] = [];

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


                parserHelper.parseWhitespace(t);
            }

            t.tryRead("}");

            return new Proof.TheoremDescription(name, declarations, assertion, steps);
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

                    if (t.tryRead("[")) {
                        parserHelper.parseWhitespace(t);
                        argument = this.termParser.parseTerm(t, context);
                        parserHelper.parseWhitespace(t);
                        t.tryRead("]");
                    } else if (t.tryRead("@")) {

                        var ref = t.readWhile(c => parserHelper.lettersAndNumbers.indexOf(c) !== -1);
                        argument = new Proof.StepRef(ref);

                    } else {
                        argument = this.formulaParser.parseFormula(t, context);
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


        private parseAxiom(tokenizer: Tokenizer): Proof.AxiomDescription {

            parserHelper.parseWhitespace(tokenizer);

            var name = null;
            var declarations: Syntax.Declaration[] = [];
            var assertion: Syntax.Formula = null;

            if (tokenizer.peek() !== "{") {
                name = parserHelper.parseIdentifier(tokenizer);
                parserHelper.parseWhitespace(tokenizer);
            }

            tokenizer.tryRead("{");
            parserHelper.parseWhitespace(tokenizer);

            while (tokenizer.peek() !== "" && tokenizer.peek() !== "}") {

                var s = this.readNextSection(tokenizer);

                if (s === null) {
                    tokenizer.readWhile(c => parserHelper.letters.indexOf(c) === -1);
                    continue;
                }

                if (s === "Symbols") {
                    declarations = this.parseSymbols(tokenizer);
                }
                if (s === "Assertion") {
                    parserHelper.parseWhitespace(tokenizer);
                    tokenizer.tryRead("|-");
                    var context = new Parser.ParserContext(declarations);

                    var start = tokenizer.getPosition();
                    assertion = this.formulaParser.parseFormula(tokenizer, context);
                    var region = tokenizer.getRegion(start);
                    (<any>assertion).getTextRegion = () => region;
                }

                parserHelper.parseWhitespace(tokenizer);
            }

            tokenizer.tryRead("}");

            return new Proof.AxiomDescription(name, declarations, assertion);
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

                while (tokenizer.peek() !== "") {
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
