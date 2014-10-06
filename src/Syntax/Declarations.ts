
module FirstOrderPredicateLogic.Syntax {

    export class Declaration extends Node implements IEquatable<Declaration> {
        private name: string;

        constructor(name: string) {
            super();
            this.name = name;
        }

        public getName(): string {
            return this.name;
        }
        
        public substitute(substitutions: Substitution[]): Node {
            return Helper.firstOrDefault(substitutions, this,
                s => s.getDeclarationToSubstitute().equals(this) ? s.getElementToInsert() : null);
        }

        public equals(other: Declaration): boolean {

            if (!(typeof this === typeof other))
                return false;

            return this.name === other.getName();
        }

        public createSubstitution(elementToInsert: any): Substitution {
            throw "abstract";
        }
    }

    export class VariableDeclaration extends Declaration {
        public toString() {
            return "Variable declaration of " + this.getName();
        }

        public createSubstitution(elementToInsert: any) {

            if (elementToInsert instanceof VariableRef)
                elementToInsert = (<VariableRef>elementToInsert).getDeclaration();

            return new VariableSubstition(this, <VariableDeclaration>elementToInsert);
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

        public createSubstitution(elementToInsert: any) {
            return new FunctionSubstitution(this, <FunctionDeclaration>elementToInsert);
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

        public createSubstitution(elementToInsert: any) {
            return new PredicateSubstitution(this, <PredicateDeclaration>elementToInsert);
        }
    }


    export class TermDeclaration extends Declaration {
        public toString() {
            return "Term declaration of " + this.getName();
        }

        public createSubstitution(elementToInsert: any) {
            return new TermSubstitution(this, <Term>elementToInsert);
        }
    }

    export class FormulaDeclaration extends Declaration {

        public toString(): string {
            return "Formula declaration of " + this.getName();
        }

        public createSubstitution(elementToInsert: any) {
            return new FormulaSubstitution(this, <Formula>elementToInsert);
        }
    }
}