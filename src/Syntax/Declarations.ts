
module FirstOrderPredicateLogic.Syntax {

    export class Declaration {
        private name: string;

        constructor(name: string) {
            this.name = name;
        }

        public getName(): string {
            return this.name;
        }
        
        public equals(other: Declaration): boolean {

            if (!(typeof this === typeof other))
                return false;

            return this.name === other.getName();
        }
    }

    export class VariableDeclaration extends Declaration {
        public toString() {
            return "Variable declaration of " + this.getName();
        }
    }

    export class FunctionDeclaration extends Declaration {
        private arity: number;

        constructor(name: string, arity: number) {
            super(name);
            this.arity = arity;
        }

        public getArity(): number {
            return this.arity;
        }

        public toString() {
            return "Function declaration of " + this.getName();
        }

        public equals(other: Declaration): boolean {
            return super.equals(other) && (<FunctionDeclaration>other).arity == this.arity;
        }
    }

    export class PredicateDeclaration extends Declaration {

        private arity: number;

        constructor(name: string, arity: number) {
            super(name);
            this.arity = arity;
        }

        public getArity(): number {
            return this.arity;
        }

        public toString(): string {
            return "Predicate declaration of " + this.getName();
        }

        public equals(other: Declaration): boolean {
            return super.equals(other) && (<PredicateDeclaration>other).arity == this.arity;
        }
    }


    export class TermDeclaration extends Declaration {
        public toString() {
            return "Term declaration of " + this.getName();
        }
    }

    export class FormulaDeclaration extends Declaration {

        public toString(): string {
            return "Formula declaration of " + this.getName();
        }
    }
}