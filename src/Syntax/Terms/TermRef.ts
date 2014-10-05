
module FirstOrderPredicateLogic.Syntax {

    export class TermRef extends Term {

        private declaration: TermDeclaration;

        constructor(termDeclaration: TermDeclaration) {
            super();
            this.declaration = termDeclaration;
        }

        public getDeclaration(): TermDeclaration {
            return this.declaration;
        }

        public toString(): string {
            return this.declaration.getName();
        }
    }
}