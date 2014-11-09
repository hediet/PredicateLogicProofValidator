module FirstOrderPredicateLogic.Proof {
    import ConditionContext = Syntax.ConditionContext;
    import VariableDeclaration = Syntax.VariableDeclaration;
    import FormulaDeclaration = Syntax.FormulaDeclaration;
    import NodeArray = Syntax.NodeArray;
    import AppliedSubstitution = Syntax.AppliedSubstitution;
    import FormulaRef = Syntax.FormulaRef;
    import VariableWithTermSubstitution = Syntax.VariableWithTermSubstitution;
    import Formula = Syntax.Formula;
    import TermDeclaration = FirstOrderPredicateLogic.Syntax.TermDeclaration;
    import TermRef = FirstOrderPredicateLogic.Syntax.TermRef;

    export class ConditionContextImplementation extends ConditionContext {

        private conditions: AppliedCondition[];

        constructor(conditions: AppliedCondition[]) {
            super();
            this.conditions = conditions;
            //todo: check whether conditions are collision free
        }

        public getConditions(): AppliedCondition[] {
            return this.conditions;
        }


        public formulaGetUnboundVariables(declaration: FormulaDeclaration): VariableDeclaration[] {
            var onlyCondition =
                Common.firstOrDefault(this.getConditions(), null, c =>
                    (c.getCondition() instanceof Proof.FreeVariableRestrictionCondition)
                    && new Syntax.FormulaRef(declaration).equals(<Formula>c.getArguments()[1])
                    ? c : null);

            if (onlyCondition != null) {

                var args = onlyCondition.getArguments();
                var nodeArray = <NodeArray>args[0];
                var variables = <VariableDeclaration[]>nodeArray.getItems();
                return variables;
            }


            var isClosedCondition =
                Common.firstOrDefault(this.getConditions(), null, c =>
                    (c.getCondition() instanceof Proof.IsClosedCondition)
                    && new Syntax.FormulaRef(declaration).equals(<Formula>c.getArguments()[0])
                    ? c : null);

            if (isClosedCondition != null) {
                return [];
            }

            return null;
        }

        public formulaContainsUnboundVariable(declaration: FormulaDeclaration, variable: VariableDeclaration): boolean {


            var result = null;

            this.conditions.forEach(c => {
                if (c.getCondition() instanceof DoesNotContainFreeVariableCondition) {

                    var variableArg = <VariableDeclaration>c.getArguments()[0];
                    var formulaArg = <FormulaRef>c.getArguments()[1];

                    if (declaration.equals(formulaArg.getFormulaDeclaration()) && variableArg.equals(variable))
                        result = false;
                }
            });

            if (result !== null)
                return result;

            var unboundVariables = this.formulaGetUnboundVariables(declaration);
            if (unboundVariables !== null) {
                return unboundVariables.some(v => v.equals(variable));
            }

            return null;
        }

        public formulaContainsBoundVariable(declaration: FormulaDeclaration, variable: VariableDeclaration): boolean {
            return null;
        }

        public formulaIsSubstitutionCollisionFree(declaration: FormulaDeclaration,
            substitution: VariableWithTermSubstitution, context: ConditionContext): boolean {

            var result = null;

            //formulaContainsUnboundVariable can return null
            if (this.formulaContainsUnboundVariable(declaration, substitution.getVariableToSubstitute()) === false)
                return true;

            this.conditions.forEach(c => {
                if (c.getCondition() instanceof IsCollisionFreeCondition) {

                    var appliedSubstitution = <AppliedSubstitution>c.getArguments()[0];
                    if (appliedSubstitution.equals(new AppliedSubstitution(new FormulaRef(declaration), substitution)))
                        result = true;
                }
            });


            return result;
        }

        public termContainsVariable(declaration: TermDeclaration, variable: VariableDeclaration): boolean {

            var result = null;

            this.conditions.forEach(c => {
                if (c.getCondition() instanceof DoesNotContainVariableCondition) {

                    var variableArg = <VariableDeclaration>c.getArguments()[0];
                    var termArg = <TermRef>c.getArguments()[1];

                    if (declaration.equals(termArg.getTermDeclaration()) && variableArg.equals(variable))
                        result = false;
                }
            });

            return result;
        }
    }
}