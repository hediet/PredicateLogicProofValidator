
module FirstOrderPredicateLogic.Syntax {

    export class AppliedSubstitution extends Formula {

        private formulaToSubstitute: Formula;
        private substitution: VariableWithTermSubstitution;
        private cachedSubstitutedFormula: Formula = null;

        constructor(formulaToSubstitute: Formula, substitution: VariableWithTermSubstitution) {
            super();

            Helper.ArgumentExceptionHelper.ensureTypeOf(formulaToSubstitute, Formula, "formulaToSubstitute");
            Helper.ArgumentExceptionHelper.ensureTypeOf(substitution, VariableWithTermSubstitution, "substitution");

            this.formulaToSubstitute = formulaToSubstitute;
            this.substitution = substitution;
        }

        public getFormulaToSubstitute(): Formula {
            return this.formulaToSubstitute;
        }

        public getSubstitution(): VariableWithTermSubstitution {
            return this.substitution;
        }

        public isCollisionFree(context: ConditionContext): boolean {
            if (this.substitution.isIdentity())
                return true;
            return this.formulaToSubstitute.isSubstitutionCollisionFree(this.substitution, context);
        }

        /**
         * Gets the formula to which the substitution has been applied.
         */
        public getSubstitutedFormula(context: ConditionContext): Formula {

            if (this.cachedSubstitutedFormula === null) {
                this.cachedSubstitutedFormula = this.formulaToSubstitute.substituteUnboundVariables([this.substitution], context);
            }

            return this.cachedSubstitutedFormula;
        }

        public toString(args: IFormulaToStringArgs = defaultFormulaToStringArgs): string {

            var subArgs = {
                forceParenthesis: args.forceParenthesis,
                parentOperatorPriority: 100000,
                useUnicode: args.useUnicode
            };

            return this.formulaToSubstitute.toString(subArgs) + this.substitution.toString(args.useUnicode);
        }


        public substitute(substitutions: Substitution[]): Formula {

            var newVariableToSubstitute = this.substitution.getVariableToSubstitute().substitute(substitutions);
            var newTermToInsert = this.substitution.getTermToInsert().substitute(substitutions);
            var newFormulaToSubstitute = this.formulaToSubstitute.substitute(substitutions);

            return new AppliedSubstitution(newFormulaToSubstitute,
                new VariableWithTermSubstitution(newVariableToSubstitute, newTermToInsert));
        }

        public processAppliedSubstitutions(context: ConditionContext): Formula {

            var result = this.formulaToSubstitute.processAppliedSubstitutions(context);
            if (!this.substitution.isIdentity())
                result = result.substituteUnboundVariables([this.substitution], context);
            return result;
        }


        public getDeclarations(): Declaration[] {

            var result = this.formulaToSubstitute.getDeclarations();
            result.concat(this.substitution.getTermToInsert().getDeclarations());
            result.push(this.substitution.getVariableToSubstitute());

            return Helper.unique(result, decl => decl.toString());
        }


        public substituteUnboundVariables(substitutions: VariableWithTermSubstitution[], context: ConditionContext): Formula {
            //todo: Improve substitution (but this implementation should work too)
            return substitutions.reduce<Formula>((last, s) => new AppliedSubstitution(last, s), this);
        }


        public isSubstitutionCollisionFree(substitution: VariableWithTermSubstitution, context: ConditionContext): boolean {

            //Maybe this question is too hard to solve...
            throw "Currently, checking whether iterated applied substitutions are collision free is not supported.";
        }



        public containsUnboundVariable(variable: VariableDeclaration, context: ConditionContext): boolean {

            if (!this.substitution.getVariableToSubstitute().equals(variable)) {
                if (this.formulaToSubstitute.containsUnboundVariable(variable, context))
                    return true;
            }

            if (this.formulaToSubstitute.containsUnboundVariable(this.substitution.getVariableToSubstitute(), context)) {
                if (this.substitution.getTermToInsert().containsVariable(variable, context))
                    return true;
            }

            return false;
        }

        public containsBoundVariable(variable: VariableDeclaration, context: ConditionContext): boolean {
            if (this.formulaToSubstitute.containsBoundVariable(variable, context))
                return true;
            if (this.isCollisionFree(context) || !this.substitution.getTermToInsert().containsVariable(variable, context))
                return false;

            throw "'" + variable.getName() + "' may be bound or not. In this implementation it cannot be decided.";
        }

        public getUnboundVariables(context: ConditionContext): VariableDeclaration[] {

            var unboundVariables = this.formulaToSubstitute.getUnboundVariables(context);

            if (this.isCollisionFree(context)) {
                //every free variable in 'termToInsert' will stay free.

                if (!this.formulaToSubstitute.containsUnboundVariable(this.substitution.getVariableToSubstitute(), context))
                    return unboundVariables;

                var termVariables = this.substitution.getTermToInsert().getDeclarations()
                    .filter(d => d instanceof VariableDeclaration)
                    .map(d => <VariableDeclaration>d);

                unboundVariables = unboundVariables.filter(v => !v.equals(this.substitution.getVariableToSubstitute())).concat(termVariables);
                return Helper.unique(unboundVariables, v => v.getName());
            }

            throw "In this implementation, the unbound variables cannot be obtained because this applied substitution is not collision free";
        }
    }
}