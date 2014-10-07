module FirstOrderPredicateLogic.Syntax {

    export class FormulaRef extends Formula {

        private formulaDeclaration: FormulaDeclaration;

        constructor(formulaDeclaration: FormulaDeclaration) {
            super();

            Helper.ArgumentExceptionHelper.ensureTypeOf(formulaDeclaration, FormulaDeclaration, "formulaDeclaration");

            this.formulaDeclaration = formulaDeclaration;
        }

        public getFormulaDeclaration(): FormulaDeclaration {
            return this.formulaDeclaration;
        }

        public isSubstitutionCollisionFree(substitution: VariableWithTermSubstitution, context: ConditionContext): boolean {

            if (!this.containsUnboundVariable(substitution.getVariableToSubstitute(), context))
                return true;

            //todo
            return true;
        }

        public substituteUnboundVariables(substitutions: VariableWithTermSubstitution[], context: ConditionContext): Formula {
            //todo
            return substitutions.reduce<Formula>((last, s) => new AppliedSubstitution(last, s), this);
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

            var conditions = context.getConditions();

            var onlyCondition =
                Helper.firstOrDefault(conditions, null, c =>
                    (c.getCondition() instanceof Proof.OnlyContainsSpecifiedFreeVariablesCondition) &&  this.equals(<Syntax.Formula>c.getArguments()[1])
                    ? c : null);

            if (onlyCondition != null) {

                var args = onlyCondition.getArguments();
                var nodeArray = <Proof.NodeArray>args[0];
                var variables = <Syntax.VariableDeclaration[]>nodeArray.getItems();
                return variables;
            }


            throw "unbound variables are not specified for " + this.toString();
        }

        public containsUnboundVariable(variable: VariableDeclaration, context: ConditionContext): boolean {

            return this.getUnboundVariables(context).some(v => v.equals(variable));

            throw "unbound variables are not specified for " + this.toString();
        }

        public containsBoundVariable(variable: VariableDeclaration, context: ConditionContext): boolean {
            


            throw "bound variables are not specified for " + this.toString();
        }

        public getDeclarations(): Declaration[] {
            return [this.getFormulaDeclaration()];
        }

        public toString(args: IFormulaToStringArgs = defaultFormulaToStringArgs): string {
            return this.formulaDeclaration.getName();
        }
    }
}