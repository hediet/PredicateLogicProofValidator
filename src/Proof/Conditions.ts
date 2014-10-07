
module FirstOrderPredicateLogic.Proof {


    export interface ICondition {
        getName(): string;
        getTemplate(): string;
        getParameterTypes(): any[];
        check(args: Syntax.Node[], context: Syntax.ConditionContext): boolean;
    }

    export class IsCollisionFreeCondition implements ICondition {

        public static getInstance() {
            return new IsCollisionFreeCondition();
        }

        public getName(): string {
            return "IsCollisionFree";
        }

        public getTemplate(): string {
            return "? is collision free";
        }

        public getParameterTypes(): any[] {
            return [Syntax.AppliedSubstitution];
        }

        public check(args: Syntax.Node[], context: Syntax.ConditionContext): boolean {

            var formula = args[0];

            if (!(formula instanceof Syntax.AppliedSubstitution)) {
                throw "invalid formula";
            }

            return (<Syntax.AppliedSubstitution>formula).isCollisionFree(context);
        }
    }

    export class DoesNotContainFreeVariableCondition implements ICondition {

        public static getInstance() {
            return new DoesNotContainFreeVariableCondition();
        }

        public getName(): string {
            return "DoesNotContainFreeVariable";
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

    export class NodeArray extends Syntax.Node {

        private items: Syntax.Node[];

        constructor(items: Syntax.Node[]) {
            super();

            this.items = items;
        }

        public getItems(): Syntax.Node[] {
            return this.items;
        }

        public substitute(substitutions: Syntax.Substitution[]): NodeArray {
            return new NodeArray(this.items.map(item => item.substitute(substitutions)));
        }

        public toString(): string {
            return "{ " + this.items.join(", ") + " }";
        }

        public equals(other: Syntax.Node): boolean {
            if (!(other instanceof NodeArray))
                return false;
            var otherNodeArray = <NodeArray>other;

            if (this.items.length !== otherNodeArray.items.length)
                return false;
            return this.items.every((item, idx) => item.equals(otherNodeArray.items[idx]));
        }
    }

    export class ArrayType {
        
        private baseType: any;

        constructor(baseType: any) {
            this.baseType = baseType;
        }

        public getItemType() {
            return this.baseType;
        }
    }

    export class OnlyContainsSpecifiedFreeVariablesCondition implements ICondition {

        public static getInstance() {
            return new OnlyContainsSpecifiedFreeVariablesCondition();
        }

        public getName(): string {
            return "OnlyContainsSpecifiedFreeVariables";
        }

        public getTemplate(): string {
            return "Only ? are free in ?";
        }

        public getParameterTypes(): any[] {
            return [new ArrayType(Syntax.VariableDeclaration), Syntax.Formula];
        }

        public check(args: Syntax.Node[], context: Syntax.ConditionContext): boolean {

            var nodeArray = <NodeArray>args[0];
            var formula = <Syntax.Formula>args[1];

            var variables = <Syntax.VariableDeclaration[]>nodeArray.getItems();

            var actualVariables = formula.getUnboundVariables(context);

            var hashtable: { [id: string]: Syntax.VariableDeclaration } = {};
            variables.forEach(v => hashtable[v.toString()] = v);

            if (actualVariables.length !== variables.length)
                return false;

            return actualVariables.every(v => v.equals(hashtable[v.toString()]));
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

        public check(args: Syntax.Substitution[], context: Syntax.ConditionContext): boolean {

            var conditionArgs = this.arguments.map(a => a.substitute(args));

            return this.condition.check(conditionArgs, context);
        }
    }
}