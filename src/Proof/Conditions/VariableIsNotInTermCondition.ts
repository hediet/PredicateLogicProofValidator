 module FirstOrderPredicateLogic.Proof {
 
    export class VariableIsNotInTermCondition implements Condition {

        public static getInstance() {
            return new VariableIsNotInTermCondition();
        }

        public getName(): string {
            return "Variable Is Not In Term";
        }

        public getTemplate(): string {
            return "? is not in ?";
        }

        public getParameterTypes(): any[] {
            return [Syntax.VariableDeclaration, Syntax.Term];
        }

        public check(args: Syntax.Node[], context: Syntax.ConditionContext): boolean {

            var vd = <Syntax.VariableDeclaration>args[0];
            var term = <Syntax.Term>args[1];

            return !term.containsVariable(vd, context);
        }
    }

 }