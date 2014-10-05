
module FirstOrderPredicateLogic.Syntax {

    export class VariableRef extends Term {

        private variableDeclaration: VariableDeclaration;

        constructor(variableDeclaration: VariableDeclaration) {
            super();
            this.variableDeclaration = variableDeclaration;
        }

        public getName(): string {
            return name;
        }

        public getContainingVariables(): VariableDeclaration[] {
            return [this.variableDeclaration];
        }

        public containsVariable(variable: VariableDeclaration): boolean {
            return variable.equals(this.variableDeclaration);
        }

        public substitute(substitutions: VariableWithTermSubstitution[]): Term {

            var result: Term = this;

            substitutions.some(s => {

                if (s.getVariableToSubstitute().equals(this.variableDeclaration)) {
                    result = s.getTermToInsert();
                    return true;
                }
                return false;
            });

            return result;
        }

        public toString() {
            return this.variableDeclaration.getName();
        }
    }
}