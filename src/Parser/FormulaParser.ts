module FirstOrderPredicateLogic.Parser {

    export class FormulaParser {

        private termParser: TermParser;
        private operationFactories: Syntax.OperationFactory[];

        constructor(termParser: TermParser, operationFactories: Syntax.OperationFactory[]) {
            this.termParser = termParser;
            this.operationFactories = operationFactories;
        }

        private parseWhitespace(t: Tokenizer): string {
            return t.readWhile(c => " \t".indexOf(c) !== -1);
        }

        private expect(t: Tokenizer, l: ParserLogger, text: string) {
            if (!t.tryRead(text)) {
                l.logError("Expected '" + text + "'", t.getRegion(t.getPosition()));
            }
        }


        public parseFormula(tokenizer: Tokenizer, context: IParserContext, logger: ParserLogger): Syntax.Formula {

            var start = tokenizer.getPosition();

            // e.g. P(Term, ...), P(Term) -> (Q(Term) -> S), forall s: P(Term)
            try {
                return this.parseBinaryFormulaIntern(tokenizer, context, logger, 0);
            } catch (e) {
                logger.logError("An exception occured: " + e, tokenizer.getRegion(start));
                return null;
            }
        }

        private parseBinaryFormulaIntern(t: Tokenizer, context: IParserContext, l: ParserLogger, requiredOperatorPriority: number): Syntax.Formula {

            var result: Syntax.Formula = this.parseFormulaIntern(t, context, l, requiredOperatorPriority);

            this.parseWhitespace(t);

            var startPos = t.getPosition();

            while (true) {

                this.parseWhitespace(t);

                var c = t.peek();

                if (c === ")" || c === "")
                    return result;

                if (c === "[") {
                    result = this.parseSubstitution(result, t, context, l);
                    continue;
                }

                var couldParse = false;

                // check binary operations
                for (var idx in this.operationFactories) {
                    var of = this.operationFactories[idx];

                    if (of.getArity() === 2 && t.tryRead(of.getName(), false)) {

                        if (!(of.getPriority() > requiredOperatorPriority))
                            return result;

                        t.tryRead(of.getName());

                        this.parseWhitespace(t);
                        var arg = this.parseBinaryFormulaIntern(t, context, l, of.getPriority());

                        result = of.createInstance([result, arg]);
                        couldParse = true;
                    }
                }

                if (!couldParse)
                    return result;
            }

        }

        private parseFormulaIntern(t: Tokenizer, context: IParserContext, l: ParserLogger, requiredOperatorPriority: number): Syntax.Formula {

            this.parseWhitespace(t);

            var c = t.peek();

            if (c == "(")
                return this.parseParentheses(t, context, l);

            var startPosition = t.getPosition();

            if (t.tryRead("forall")) {

                var whitespace = this.parseWhitespace(t);

                var boundVariableName = parserHelper.parseIdentifier(t);
                var boundVariable = context.getVariableDeclaration(boundVariableName.getIdentifier());

                this.parseWhitespace(t);
                this.expect(t, l, ":");

                this.parseWhitespace(t);
                var formula = this.parseBinaryFormulaIntern(t, context, l, Syntax.AllQuantor.getPriority());

                var allQuantor = new Syntax.AllQuantor(boundVariable, formula);
                TextRegion.setRegionTo(allQuantor, t.getRegion(startPosition));
                return allQuantor;
            }


            // check unary operations
            for (var idx in this.operationFactories) {
                var of = this.operationFactories[idx];

                if (of.getArity() === 1 && t.tryRead(of.getName())) {

                    this.parseWhitespace(t);
                    var arg = this.parseBinaryFormulaIntern(t, context, l, of.getPriority());

                    return of.createInstance([arg]);
                }
            }

            var identifier = parserHelper.parseIdentifier(t);

            if (identifier !== null) {

                var formulaDeclaration = context.getFormulaDeclaration(identifier.getIdentifier());
                if (formulaDeclaration !== null) {
                    return new Syntax.FormulaRef(formulaDeclaration);

                } 

                var predicateDeclaration = context.getPredicateDeclaration(identifier.getIdentifier());

                return this.parsePredicate(predicateDeclaration, t, context, l);
                
            }

            throw "Cannot parse the expression";
        }

        private parseSubstitution(formulaToSubstitute: Syntax.Formula, t: Tokenizer,
            context: IParserContext, l: ParserLogger): Syntax.AppliedSubstitution {

            this.expect(t, l, "[");
            this.parseWhitespace(t);

            var varToSubstituteName = parserHelper.parseIdentifier(t);
            var varToSubstitute = context.getVariableDeclaration(varToSubstituteName.getIdentifier());

            this.parseWhitespace(t);
            this.expect(t, l, "<-");
            this.parseWhitespace(t);

            var replacement = this.termParser.parseTerm(t, context, l);

            this.parseWhitespace(t);

            this.expect(t, l, "]");

            return new Syntax.AppliedSubstitution(formulaToSubstitute,
                new Syntax.VariableWithTermSubstitution(varToSubstitute, replacement));
        }

        private parsePredicate(predicateDeclaration: Syntax.PredicateDeclaration,
            t: Tokenizer, context: IParserContext, l: ParserLogger): Syntax.PredicateRef {

            if (!t.tryRead("(")) {
                return new Syntax.PredicateRef(predicateDeclaration, []);
            } else {
                var arguments: Syntax.Term[] = [];
                var first: boolean = true;

                this.parseWhitespace(t);

                while (t.peek() !== ")" && t.peek() !== "") {

                    if (!first) {
                        if (!t.tryRead(","))
                            break;
                        this.parseWhitespace(t);
                    }
                    first = false;

                    var term = this.termParser.parseTerm(t, context, l);
                    arguments.push(term);

                    this.parseWhitespace(t);
                }
                this.expect(t, l, ")");

                return new Syntax.PredicateRef(predicateDeclaration, arguments);
            }
        }

        private parseParentheses(t: Tokenizer, context: IParserContext, l: ParserLogger): Syntax.Formula {

            this.expect(t, l, "(");

            var result = this.parseFormula(t, context, l);

            this.expect(t, l, ")");

            return result;
        }
    }
} 