﻿module FirstOrderPredicateLogic.Syntax {

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
    }


    export class Term {
        public getContainingVariables(): VariableDeclaration[] {
            throw "This method is abstract";
        }

        public containsVariable(variable: VariableDeclaration): boolean {
            throw "This method is abstract";
        }

        public substitute(substitutions: VariableWithTermSubstitution[]): Term {
            throw "This method is abstract";
        }
    }

}