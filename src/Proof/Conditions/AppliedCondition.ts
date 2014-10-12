 module FirstOrderPredicateLogic.Proof {

     export class AppliedCondition {

         private condition: Condition;
         private arguments: Syntax.Node[];

         constructor(condition: Condition, args: Syntax.Node[]) {

             Common.ArgumentExceptionHelper.ensureArrayTypeOf(args, Syntax.Node, "args");

             this.condition = condition;
             this.arguments = args;
         }

         public getCondition(): Condition {
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