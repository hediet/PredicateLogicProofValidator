 module FirstOrderPredicateLogic.Syntax {

    export class Node {

        public substitute(substitutions: Substitution[]): Node {
            throw "This method is abstract";
        }

        public toString(): string {
            throw "abstract";
        }

        public equals(other: Node): boolean {
            throw "abstract";
        }
    }

}