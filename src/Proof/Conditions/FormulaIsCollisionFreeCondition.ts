module FirstOrderPredicateLogic.Proof {

     export class FormulaIsCollisionFreeCondition implements Condition {

         public static getInstance() {
             return new FormulaIsCollisionFreeCondition();
         }

         public getName(): string {
             return "Formula is collision free";
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
 }