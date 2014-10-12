 module FirstOrderPredicateLogic.Proof {
 
    export class IsClosedCondition implements Condition {

        public static getInstance() {
            return new IsClosedCondition();
        }

        public getName(): string {
            return "IsClosedCondition";
        }

        public getTemplate(): string {
            return "? is closed";
        }

        public getParameterTypes(): any[] {
            return [Syntax.Formula];
        }

        public check(args: Syntax.Node[], context: Syntax.ConditionContext): boolean {

            var formula = <Syntax.Formula>args[0];

            return formula.getUnboundVariables(context).length === 0;
        }
    }

 }