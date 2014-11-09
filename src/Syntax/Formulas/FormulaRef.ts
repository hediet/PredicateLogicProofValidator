module FirstOrderPredicateLogic.Syntax {

    export class FormulaRef extends Formula {

        private formulaDeclaration: FormulaDeclaration;

        constructor(formulaDeclaration: FormulaDeclaration) {
            super();

            Common.ArgumentExceptionHelper.ensureTypeOf(formulaDeclaration, FormulaDeclaration, "formulaDeclaration");

            this.formulaDeclaration = formulaDeclaration;
        }

        public getFormulaDeclaration(): FormulaDeclaration {
            return this.formulaDeclaration;
        }

        public isSubstitutionCollisionFree(substitution: VariableWithTermSubstitution, context: ConditionContext): boolean {

            var result = context.formulaIsSubstitutionCollisionFree(this.formulaDeclaration, substitution, context);
            if (result === null)
                throw "It is not specified whether " + this + substitution + " is collision free.";
            return result;
        }

        public substituteUnboundVariables(substitutions: VariableWithTermSubstitution[], context: ConditionContext): Formula {
            var newSubsts = substitutions.filter(subst => {
                //result can be null
                if (context.formulaContainsUnboundVariable(this.formulaDeclaration, subst.getVariableToSubstitute()) === false)
                    return false;
                return true;
            });

            return newSubsts.reduce<Formula>((last, s) => new AppliedSubstitution(last, s), this);
        }

        public substitute(substitutions: Substitution[]): Formula {
            return this.formulaDeclaration.substitute(substitutions);
        }

        public resubstitute(concreteFormula: Formula, collector: ISubstitutionCollector) {
            collector.addSubstitution(new FormulaSubstitution(this.formulaDeclaration, concreteFormula));
        }

        public processAppliedSubstitutions(context: ConditionContext): Formula {
            return this;
        }

        public getUnboundVariables(context: ConditionContext): VariableDeclaration[] {

            var result = context.formulaGetUnboundVariables(this.formulaDeclaration);
            if (result === null)
                throw "unbound variables are not specified for " + this.toString();
            return result;
        }

        public containsUnboundVariable(variable: VariableDeclaration, context: ConditionContext): boolean {

            var result = context.formulaContainsUnboundVariable(this.formulaDeclaration, variable);
            if (result === null)
                throw "unbound variables are not specified for " + this.toString();
            return result;
        }

        public containsBoundVariable(variable: VariableDeclaration, context: ConditionContext): boolean {

            var result = context.formulaContainsBoundVariable(this.formulaDeclaration, variable);
            if (result === null)
                throw "bound variables are not specified for " + this.toString();
            return result;
        }

        public getDeclarations(): Declaration[] {
            return [this.getFormulaDeclaration()];
        }

        public toString(args: IFormulaToStringArgs = defaultFormulaToStringArgs): string {
            return this.formulaDeclaration.getName();
        }
    }
}