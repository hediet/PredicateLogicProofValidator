module FirstOrderPredicateLogic.Syntax {

    export class TermRef extends Term {

        private termDeclaration: TermDeclaration;

        constructor(termDeclaration: TermDeclaration) {
            super();

            Common.ArgumentExceptionHelper.ensureTypeOf(termDeclaration, TermDeclaration, "termDeclaration");

            this.termDeclaration = termDeclaration;
        }


        public substituteVariables(substitutions: VariableWithTermSubstitution[]): Term {
            return this; //TODO
        }

        public substitute(substitutions: Substitution[]): Term {
            return this.termDeclaration.substitute(substitutions);
        }

        public resubstitute(concreteFormula: Term, collector: ISubstitutionCollector) {
            collector.addSubstitution(new TermSubstitution(this.getTermDeclaration(), concreteFormula));
        }

        public getTermDeclaration(): TermDeclaration {
            return this.termDeclaration;
        }

        public getDeclarations(): Declaration[] {
            return [this.termDeclaration];
        }

        public toString(): string {
            return this.termDeclaration.getName();
        }
    }
}