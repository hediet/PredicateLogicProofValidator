module FirstOrderPredicateLogic.Proof {
    import ConditionContext = Syntax.ConditionContext;

    export class Condition {
        public getName(): string {
            throw "abstract";
        }

        public getTemplate(): string {
            throw "abstract";
        }

        public getParameterTypes(): any[] {
            throw "abstract";
        }

        public check(args: Syntax.Node[], context: ConditionContext): boolean {
            throw "abstract";
        }
        
        public static getAvailableConditions() {
            return [
                FirstOrderPredicateLogic.Proof.FormulaIsCollisionFreeCondition.getInstance(),
                FirstOrderPredicateLogic.Proof.VariableIsNotFreeInFormulaCondition.getInstance(),
                FreeVariableRestrictionCondition.getInstance(),
                FirstOrderPredicateLogic.Proof.FormulaIsClosedCondition.getInstance(),
                FirstOrderPredicateLogic.Proof.VariableIsNotFreeInHypothesisCondition.getInstance(),
                FirstOrderPredicateLogic.Proof.VariableIsNotInTermCondition.getInstance()
            ];
        }
    }

}