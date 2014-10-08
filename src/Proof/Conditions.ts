module FirstOrderPredicateLogic.Proof {

    export class ConditionContext extends Syntax.ConditionContext {

        private conditions: Proof.AppliedCondition[];

        constructor(conditions: Proof.AppliedCondition[]) {
            super();
            this.conditions = conditions;
        }

        public getConditions(): Proof.AppliedCondition[] {
            return this.conditions;
        }


        public formulaGetUnboundVariables(declaration: Syntax.FormulaDeclaration): Syntax.VariableDeclaration[] {
            var onlyCondition =
                Common.firstOrDefault(this.getConditions(), null, c =>
                    (c.getCondition() instanceof Proof.OnlyContainsSpecifiedFreeVariablesCondition)
                    && new Syntax.FormulaRef(declaration).equals(<Syntax.Formula>c.getArguments()[1])
                    ? c : null);

            if (onlyCondition != null) {

                var args = onlyCondition.getArguments();
                var nodeArray = <Syntax.NodeArray>args[0];
                var variables = <Syntax.VariableDeclaration[]>nodeArray.getItems();
                return variables;
            }

            return null;
        }

        public formulaContainsUnboundVariable(declaration: Syntax.FormulaDeclaration, variable: Syntax.VariableDeclaration): boolean {

            var unboundVariables = this.formulaGetUnboundVariables(declaration);
            if (unboundVariables !== null) {
                return unboundVariables.some(v => v.equals(variable));
            }

            return null;
        }

        public formulaContainsBoundVariable(declaration: Syntax.FormulaDeclaration, variable: Syntax.VariableDeclaration): boolean {
            return null;
        }

        public formulaIsSubstitutionCollisionFree(declaration: Syntax.FormulaDeclaration,
            substitution: Syntax.VariableWithTermSubstitution, context: ConditionContext): boolean {

            var result = null;

            this.conditions.forEach(c => {
                if (c.getCondition() instanceof Proof.IsCollisionFreeCondition) {

                    var appliedSubstitution = <Syntax.AppliedSubstitution>c.getArguments()[0];
                    if (appliedSubstitution.equals(
                        new Syntax.AppliedSubstitution(new Syntax.FormulaRef(declaration), substitution)))
                        result = true;
                }
            });


            return result;
        }
    }




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
            return [new Common.ArrayType(Syntax.VariableDeclaration), Syntax.Formula];
        }

        public check(args: Syntax.Node[], context: Syntax.ConditionContext): boolean {

            var nodeArray = <Syntax.NodeArray>args[0];
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