module FirstOrderPredicateLogic.Proof {

    export class ConditionContext extends Syntax.ConditionContext {

        private conditions: Proof.AppliedCondition[];

        constructor(conditions: Proof.AppliedCondition[]) {
            super();
            this.conditions = conditions;
            //todo: check whether conditions are collision free
        }

        public getConditions(): Proof.AppliedCondition[] {
            return this.conditions;
        }


        public formulaGetUnboundVariables(declaration: Syntax.FormulaDeclaration): Syntax.VariableDeclaration[] {
            var onlyCondition =
                Common.firstOrDefault(this.getConditions(), null, c =>
                    (c.getCondition() instanceof Proof.FreeVariableRestrictionCondition)
                    && new Syntax.FormulaRef(declaration).equals(<Syntax.Formula>c.getArguments()[1])
                    ? c : null);

            if (onlyCondition != null) {

                var args = onlyCondition.getArguments();
                var nodeArray = <Syntax.NodeArray>args[0];
                var variables = <Syntax.VariableDeclaration[]>nodeArray.getItems();
                return variables;
            }


            var isClosedCondition =
                Common.firstOrDefault(this.getConditions(), null, c =>
                    (c.getCondition() instanceof Proof.IsClosedCondition)
                    && new Syntax.FormulaRef(declaration).equals(<Syntax.Formula>c.getArguments()[0])
                    ? c : null);

            if (isClosedCondition != null) {
                return [];
            }

            return null;
        }

        public formulaContainsUnboundVariable(declaration: Syntax.FormulaDeclaration, variable: Syntax.VariableDeclaration): boolean {

            var unboundVariables = this.formulaGetUnboundVariables(declaration);
            if (unboundVariables !== null) {
                return unboundVariables.some(v => v.equals(variable));
            }

            return null;
        }

        public formulaContainsBoundVariable(declaration: Syntax.FormulaDeclaration, variable: Syntax.VariableDeclaration): boolean {
            return null;
        }

        public formulaIsSubstitutionCollisionFree(declaration: Syntax.FormulaDeclaration,
            substitution: Syntax.VariableWithTermSubstitution, context: ConditionContext): boolean {

            var result = null;

            if (this.formulaContainsUnboundVariable(declaration, substitution.getVariableToSubstitute()) === false)
                return true;

            this.conditions.forEach(c => {
                if (c.getCondition() instanceof Proof.IsCollisionFreeCondition) {

                    var appliedSubstitution = <Syntax.AppliedSubstitution>c.getArguments()[0];
                    if (appliedSubstitution.equals(
                        new Syntax.AppliedSubstitution(new Syntax.FormulaRef(declaration), substitution)))
                        result = true;
                }
            });


            return result;
        }
    }
}