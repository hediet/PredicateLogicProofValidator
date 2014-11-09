 module FirstOrderPredicateLogic.Proof {
 
     export class VariableIsNotFreeInHypothesisCondition implements Condition {

        public static getInstance() {
            return new VariableIsNotFreeInHypothesisCondition();
        }

        public getName(): string {
            return "Variable Is Not Free In Hypothesis";
        }

        public getTemplate(): string {
            return "? is not free in hypothesis";
        }

        public getParameterTypes(): any[] {
            return [Syntax.VariableDeclaration];
        }

        public check(args: Syntax.Node[], context: Syntax.ConditionContext): boolean {

            return true; //cannot checked here, instead in the rule
        }
    }

 }