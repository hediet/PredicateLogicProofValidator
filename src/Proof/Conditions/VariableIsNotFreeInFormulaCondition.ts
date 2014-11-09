 module FirstOrderPredicateLogic.Proof {
 
    export class VariableIsNotFreeInFormulaCondition implements Condition {

        public static getInstance() {
            return new VariableIsNotFreeInFormulaCondition();
        }

        public getName(): string {
            return "Variable Is Not Free In Formula";
        }

        public getTemplate(): string {
            return "? is not free in ?";
        }

        public getParameterTypes(): any[] {
            return [Syntax.VariableDeclaration, Syntax.Formula];
        }

        public check(args: Syntax.Node[], context: Syntax.ConditionContext): boolean {

            var vd = <Syntax.VariableDeclaration>args[0];
            var formula = <Syntax.Formula>args[1];

            return !formula.containsUnboundVariable(vd, context);
        }
    }

 }