 module FirstOrderPredicateLogic.Syntax {
     import ArgumentExceptionHelper = Common.ArgumentExceptionHelper;

     export class NodeArray extends Node {

         private items: Node[];

         constructor(items: Node[]) {
             super();

             ArgumentExceptionHelper.ensureArrayTypeOf(items, Node, "items");

             this.items = items;
         }

         public getItems(): Node[] {
             return this.items;
         }

         public substitute(substitutions: Syntax.Substitution[]): NodeArray {
             return new NodeArray(this.items.map(item => item.substitute(substitutions)));
         }

         public toString(): string {
             return "{ " + this.items.join(", ") + " }";
         }

         public equals(other: Node): boolean {
             if (!(other instanceof NodeArray))
                 return false;
             var otherNodeArray = <NodeArray>other;

             if (this.items.length !== otherNodeArray.items.length)
                 return false;
             return this.items.every((item, idx) => item.equals(otherNodeArray.items[idx]));
         }
     }
 }