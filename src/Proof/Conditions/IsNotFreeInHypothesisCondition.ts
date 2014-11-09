 module FirstOrderPredicateLogic.Proof {
 
     export class IsNotFreeInHypothesisCondition implements Condition {

        public static getInstance() {
            return new IsNotFreeInHypothesisCondition();
        }

        public getName(): string {
            return "IsNotFreeInHypothesis";
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