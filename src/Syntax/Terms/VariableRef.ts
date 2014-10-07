module FirstOrderPredicateLogic.Syntax {

    export class VariableRef extends Term {

        private variableDeclaration: VariableDeclaration;

        constructor(variableDeclaration: VariableDeclaration) {
            super();

            Helper.ArgumentExceptionHelper.ensureTypeOf(variableDeclaration, VariableDeclaration, "variableDeclaration");

            this.variableDeclaration = variableDeclaration;
        }

        public getName(): string {
            return name;
        }

        public getDeclarations(): Declaration[] {
            return [this.variableDeclaration];
        }

        public getVariableDeclaration(): VariableDeclaration {
            return this.variableDeclaration;
        }

        public containsVariable(variable: VariableDeclaration): boolean {
            return variable.equals(this.variableDeclaration);
        }

        public substituteVariables(substitutions: VariableWithTermSubstitution[]): Term {

            return Helper.firstOrDefault(substitutions, this,
                subst => subst.getVariableToSubstitute().equals(this.variableDeclaration)
                    ? subst.getTermToInsert() : null);
        }

        public toString() {
            return this.variableDeclaration.getName();
        }

        public equals(other: Term): boolean {
            if (!(other instanceof VariableRef))
                return false;
            var otherVariableRef = <VariableRef>other;
            return this.variableDeclaration.equals(otherVariableRef.getVariableDeclaration());
        }
    }
}