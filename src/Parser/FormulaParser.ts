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

        public parseFormula(tokenizer: Tokenizer, context: IParserContext): Syntax.Formula {


            // e.g. P(Term, ...), P(Term) -> (Q(Term) -> S), forall s: P(Term)

            return this.parseFormulaIntern(tokenizer, context, 0);
        }

        private parseFormulaIntern(tokenizer: Tokenizer, context: IParserContext, requiredOperatorPriority: number): Syntax.Formula {

            var result: Syntax.Formula = this.parseFormulaIntern2(tokenizer, context, requiredOperatorPriority);

            while (true) {

                this.parseWhitespace(tokenizer);

                var c = tokenizer.peek();

                if (c === ")" || c === "")
                    return result;

                if (c === "[") {
                    result = this.parseSubstitution(result, tokenizer, context);
                    continue;
                }

                var couldParse = false;

                // check binary operations
                for (var idx in this.operationFactories) {
                    var of = this.operationFactories[idx];

                    if (of.getArity() === 2 && tokenizer.tryRead(of.getName(), false)) {

                        if (!(of.getPriority() > requiredOperatorPriority))
                            return result;

                        tokenizer.tryRead(of.getName());

                        this.parseWhitespace(tokenizer);
                        var arg = this.parseFormulaIntern(tokenizer, context, of.getPriority());

                        result = of.createInstance([result, arg]);
                        couldParse = true;
                    }
                }

                if (!couldParse)
                    return result;
            }

        }

        private parseFormulaIntern2(tokenizer: Tokenizer, context: IParserContext, requiredOperatorPriority: number): Syntax.Formula {

            this.parseWhitespace(tokenizer);

            var c = tokenizer.peek();

            if (c == "(")
                return this.parseParentheses(tokenizer, context);

            if (tokenizer.tryRead("forall")) {

                var whitespace = this.parseWhitespace(tokenizer);

                var boundVariableName = parserHelper.parseIdentifier(tokenizer);
                var boundVariable = context.getVariableDeclaration(boundVariableName);

                this.parseWhitespace(tokenizer);
                tokenizer.tryRead(":");

                this.parseWhitespace(tokenizer);
                var formula = this.parseFormulaIntern(tokenizer, context, Syntax.AllQuantor.getPriority());

                return new Syntax.AllQuantor(boundVariable, formula);
            }


            // check unary operations
            for (var idx in this.operationFactories) {
                var of = this.operationFactories[idx];

                if (of.getArity() === 1 && tokenizer.tryRead(of.getName())) {

                    this.parseWhitespace(tokenizer);
                    var arg = this.parseFormulaIntern(tokenizer, context, of.getPriority());

                    return of.createInstance([arg]);
                }
            }

            var identifier = parserHelper.parseIdentifier(tokenizer);

            if (identifier !== "") {

                var formulaDeclaration = context.getFormulaDeclaration(identifier);
                if (formulaDeclaration !== null) {
                    return new Syntax.FormulaRef(formulaDeclaration);

                } else {
                    var predicateDeclaration = context.getPredicateDeclaration(identifier);

                    return this.parsePredicate(predicateDeclaration, tokenizer, context);
                }
            }


            throw "Cannot parse the expression";
        }

        private parseSubstitution(formulaToSubstitute: Syntax.Formula, tokenizer: Tokenizer, context: IParserContext): Syntax.AppliedSubstitution {

            tokenizer.tryRead("[");
            this.parseWhitespace(tokenizer);

            var varToSubstituteName = parserHelper.parseIdentifier(tokenizer);
            var varToSubstitute = context.getVariableDeclaration(varToSubstituteName);

            this.parseWhitespace(tokenizer);
            tokenizer.tryRead("<-");
            this.parseWhitespace(tokenizer);

            var replacement = this.termParser.parseTerm(tokenizer, context);

            this.parseWhitespace(tokenizer);

            tokenizer.tryRead("]");

            return new Syntax.AppliedSubstitution(formulaToSubstitute,
                new Syntax.VariableWithTermSubstitution(varToSubstitute, replacement));
        }

        private parsePredicate(predicateDeclaration: Syntax.PredicateDeclaration,
            tokenizer: Tokenizer, context: IParserContext): Syntax.PredicateRef {

            if (!tokenizer.tryRead("(")) {
                return new Syntax.PredicateRef(predicateDeclaration, []);
            } else {
                var arguments: Syntax.Term[] = [];
                var first: boolean = true;

                this.parseWhitespace(tokenizer);

                while (!tokenizer.tryRead(")") && tokenizer.peek() !== "") {

                    if (!first) {
                        tokenizer.tryRead(",");
                        this.parseWhitespace(tokenizer);
                    }
                    first = false;

                    var term = this.termParser.parseTerm(tokenizer, context);
                    arguments.push(term);

                    this.parseWhitespace(tokenizer);

                }

                return new Syntax.PredicateRef(predicateDeclaration, arguments);
            }
        }

        private parseParentheses(tokenizer: Tokenizer, context: IParserContext): Syntax.Formula {

            tokenizer.tryRead("(");

            var result = this.parseFormula(tokenizer, context);

            tokenizer.tryRead(")");

            return result;
        }
    }
} 