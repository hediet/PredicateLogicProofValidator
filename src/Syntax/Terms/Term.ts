module FirstOrderPredicateLogic.Syntax {

    export class Term extends Node implements IEquatable<Term> {
        public getDeclarations(): Declaration[] {
            throw "This method is abstract";
        }

        public containsVariable(variable: VariableDeclaration): boolean {
            throw "This method is abstract";
        }

        public substituteVariables(substitutions: VariableWithTermSubstitution[]): Term {
            throw "This method is abstract";
        }

        public substitute(substitutions: Substitution[]): Term {
            throw "This method is abstract";
        }

        /**
         * Collects the substitutions so that this.substitute(substitutions) equals specialFormula.
         */
        public resubstitute(specialFormula: Term, substService: ISubstitutionCollector) {
            throw "This method is abstract";
        }

        public equals(other: Term): boolean {
            throw "abstract";
        }
    }
}