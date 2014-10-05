module FirstOrderPredicateLogic.Syntax {

    export class VariableWithTermSubstitution {

        private variableToSubstitute: VariableDeclaration;
        private termToInsert: Term;

        constructor(variableToSubstitute: VariableDeclaration, termToInsert: Term) {
            Helper.ArgumentExceptionHelper.ensureTypeOf(variableToSubstitute, VariableDeclaration, "variableToSubstitute");
            Helper.ArgumentExceptionHelper.ensureTypeOf(termToInsert, Term, "termToInsert");

            this.variableToSubstitute = variableToSubstitute;
            this.termToInsert = termToInsert;
        }

        public getVariableToSubstitute(): VariableDeclaration {
            return this.variableToSubstitute;
        }

        public getTermToInsert(): Term {
            return this.termToInsert;
        }

        public toString(useUnicode: boolean = false): string {

            return "[" + this.variableToSubstitute.getName() + (useUnicode ? " ⇦ " : " <- ") + this.termToInsert.toString() + "]";
        }
    }
} 