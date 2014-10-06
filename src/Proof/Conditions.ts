
module FirstOrderPredicateLogic.Proof {


    export interface ICondition {
        getName(): string;
        getTemplate(): string;
        getParameterTypes(): any[];
        check(args: Syntax.Node[]): boolean;
    }

    export class IsCollisionFreeCondition implements ICondition {

        public getName(): string {
            return "IsCollisionFree";
        }

        public getTemplate(): string {
            return "? is collision free";
        }

        public getParameterTypes(): any[] {
            return [Syntax.AppliedSubstitution];
        }

        public check(args: Syntax.Node[]): boolean {

            var formula = args[0];

            if (!(formula instanceof Syntax.AppliedSubstitution)) {
                throw "invalid formula";
            }

            return (<Syntax.AppliedSubstitution>formula).isCollisionFree();
        }
    }

    export class DoesNotContainFreeVariableCondition implements ICondition {
        public getName(): string {
            return "DoesNotContainFreeVariable";
        }

        public getTemplate(): string {
            return "? is not free in ?";
        }

        public getParameterTypes(): any[] {
            return [Syntax.VariableDeclaration, Syntax.Formula];
        }

        public check(args: Syntax.Node[]): boolean {

            var vd = <Syntax.VariableDeclaration>args[0];
            var formula = <Syntax.Formula>args[1];

            return !formula.containsUnboundVariable(vd);
        }
    }

    export class AppliedCondition {

        private condition: ICondition;
        private arguments: Syntax.Node[];

        constructor(condition: ICondition, args: Syntax.Node[]) {
            this.condition = condition;
            this.arguments = args;
        }

        public getCondition(): ICondition {
            return this.condition;
        }

        public getArguments(): Syntax.Node[] {
            return this.arguments;
        }

        public check(args: Syntax.Substitution[]): boolean {

            var conditionArgs = this.arguments.map(a => a.substitute(args));

            return this.condition.check(conditionArgs);
        }
    }
}