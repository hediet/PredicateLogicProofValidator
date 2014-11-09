module FirstOrderPredicateLogic.Syntax {

    export class TermRef extends Term {

        private termDeclaration: TermDeclaration;

        constructor(termDeclaration: TermDeclaration) {
            super();

            Common.ArgumentExceptionHelper.ensureTypeOf(termDeclaration, TermDeclaration, "termDeclaration");

            this.termDeclaration = termDeclaration;
        }


        public substituteVariables(substitutions: VariableWithTermSubstitution[], context: ConditionContext): Term {

            var newSubsts = substitutions.filter(subst => {
                //result can be null
                if (context.termContainsVariable(this.termDeclaration, subst.getVariableToSubstitute()) === false)
                    return false;
                return true;
            });

            return newSubsts.reduce<Term>((last, s) => new AppliedTermSubstitution(last, s), this);
        }

        public getVariables(context: ConditionContext): VariableDeclaration[] {
            throw "The variables for '" + this.toString() + "' are not specified";
        }

        public containsVariable(variable: VariableDeclaration, context: ConditionContext): boolean {

            var result = context.termContainsVariable(this.termDeclaration, variable);
            if (result !== null)
                return result;

            throw "It is not specified whether '" + this.toString() + "' contains '" + variable.getName() + "'";
        }

        public substitute(substitutions: Substitution[]): Term {
            return this.termDeclaration.substitute(substitutions);
        }

        public resubstitute(concreteFormula: Term, collector: ISubstitutionCollector) {
            collector.addSubstitution(new TermSubstitution(this.getTermDeclaration(), concreteFormula));
        }


        public processAppliedSubstitutions(): Term {
            return this;
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