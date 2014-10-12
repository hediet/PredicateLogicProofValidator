module FirstOrderPredicateLogic.Proof {

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

        public check(args: Syntax.Node[], context: Syntax.ConditionContext): boolean {
            throw "abstract";
        }
        
        public static getAvailableConditions() {
            return [
                IsCollisionFreeCondition.getInstance(),
                DoesNotContainFreeVariableCondition.getInstance(),
                FreeVariableRestrictionCondition.getInstance(),
                IsClosedCondition.getInstance()
            ];
        }
    }

}