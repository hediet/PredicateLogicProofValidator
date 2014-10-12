 module FirstOrderPredicateLogic.Proof {

     export class FreeVariableRestrictionCondition implements Condition {

         public static getInstance() {
             return new FreeVariableRestrictionCondition();
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
 }