
module FirstOrderPredicateLogic.Syntax {

    export class TermRef extends Term {

        private declaration: TermDeclaration;

        constructor(termDeclaration: TermDeclaration) {
            super();
            this.declaration = termDeclaration;
        }


        public substituteVariables(substitutions: VariableWithTermSubstitution[]): Term {
            return this; //TODO
        }

        public substitute(substitutions: Substitution[]): Term {

            var result: Term = this;

            substitutions.some(subst => {
                if (subst.getDeclarationToSubstitute().equals(this.getDeclaration())) {
                    result = subst.getElementToInsert();
                    return true;
                }

                return false;
            });

            return result;
        }

        public resubstitute(specialFormula: Term, substService: ISubstitutionCollector) {
            substService.addSubstitution(new TermSubstitution(this.getDeclaration(), specialFormula));
        }


        public getDeclaration(): TermDeclaration {
            return this.declaration;
        }

        public toString(): string {
            return this.declaration.getName();
        }
    }
}