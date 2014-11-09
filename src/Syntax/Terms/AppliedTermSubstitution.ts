
module FirstOrderPredicateLogic.Syntax {

    export class AppliedTermSubstitution extends Term {

        private termToSubstitute: Term;
        private substitution: VariableWithTermSubstitution;
        private cachedSubstitutedFormula: Formula = null;

        constructor(termToSubstitute: Term, substitution: VariableWithTermSubstitution) {
            super();

            Common.ArgumentExceptionHelper.ensureTypeOf(termToSubstitute, Term, "termToSubstitute");
            Common.ArgumentExceptionHelper.ensureTypeOf(substitution, VariableWithTermSubstitution, "substitution");

            this.termToSubstitute = termToSubstitute;
            this.substitution = substitution;
        }

        public getTermToSubstitute(): Term {
            return this.termToSubstitute;
        }

        public getSubstitution(): VariableWithTermSubstitution {
            return this.substitution;
        }



        public processAppliedSubstitutions(context: ConditionContext): Term {

            var result = this.termToSubstitute.processAppliedSubstitutions(context);
            if (!this.substitution.isIdentity())
                result = result.substituteVariables([this.substitution], context);
            return result;
        }



        public getDeclarations(): Declaration[] {
            var result = this.termToSubstitute.getDeclarations();
            result.concat(this.substitution.getTermToInsert().getDeclarations());
            result.push(this.substitution.getVariableToSubstitute());

            return Common.unique(result, decl => decl.toString());
        }

        public containsVariable(variable: VariableDeclaration, context: ConditionContext): boolean {
            if (!this.substitution.getVariableToSubstitute().equals(variable)) {
                if (this.termToSubstitute.containsVariable(variable, context))
                    return true;
            }

            if (this.termToSubstitute.containsVariable(this.substitution.getVariableToSubstitute(), context)) {
                if (this.substitution.getTermToInsert().containsVariable(variable, context))
                    return true;
            }

            return false;
        }

        public substituteVariables(substitutions: VariableWithTermSubstitution[], context: ConditionContext): Term {

            return substitutions.reduce<Term>((last, s) => new AppliedTermSubstitution(last, s), this);
        }


        public getVariables(context: ConditionContext): VariableDeclaration[] {

            var variables = this.termToSubstitute.getVariables(context);

            if (!this.termToSubstitute.containsVariable(this.substitution.getVariableToSubstitute(), context))
                return variables;

            var termVariables = this.substitution.getTermToInsert().getVariables(context);

            variables = variables.filter(v => !v.equals(this.substitution.getVariableToSubstitute())).concat(termVariables);
            return Common.unique(variables, v => v.getName());
        }


        public substitute(substitutions: Substitution[]): Term {
            var newVariableToSubstitute = this.substitution.getVariableToSubstitute().substitute(substitutions);
            var newTermToInsert = this.substitution.getTermToInsert().substitute(substitutions);
            var newTermToSubstitute = this.termToSubstitute.substitute(substitutions);

            return new AppliedTermSubstitution(newTermToSubstitute,
                new VariableWithTermSubstitution(newVariableToSubstitute, newTermToInsert));
        }


        /**
         * Collects the substitutions so that this.substitute(substitutions) equals specialFormula.
         */
        public resubstitute(concreteTerm: Term, collector: ISubstitutionCollector) {
            if (!(concreteTerm instanceof AppliedTermSubstitution)) {
                collector.addIncompatibleNodes(this, concreteTerm);
                return;
            }

            var concreteAppliedSubstitution = <AppliedTermSubstitution>concreteTerm;

            if (!this.substitution.getTermToInsert().equals(concreteAppliedSubstitution.substitution.getTermToInsert())) {
                collector.addIncompatibleNodes(this, concreteTerm);
                return;
            }

            if (!this.substitution.getVariableToSubstitute().equals(concreteAppliedSubstitution.substitution.getVariableToSubstitute())) {
                collector.addIncompatibleNodes(this, concreteTerm);
                return;
            }
            this.termToSubstitute.resubstitute(concreteAppliedSubstitution.termToSubstitute, collector);
        }

        public toString(): string {

            return this.termToSubstitute.toString() + this.substitution.toString(true);
        }
    }
}