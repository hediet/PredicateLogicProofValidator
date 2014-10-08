module FirstOrderPredicateLogic.Syntax {

    export class Declaration extends Node {
        private name: string;

        constructor(name: string) {
            super();

            Common.ArgumentExceptionHelper.ensureTypeOf(name, "string", "name");

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

        public createSubstitution(elementToInsert: Node): Substitution {
            throw "abstract";
        }
    }

    export class VariableDeclaration extends Declaration {
        public toString() {
            return "Variable declaration of " + this.getName();
        }

        public createSubstitution(elementToInsert: VariableDeclaration) {
            return new VariableSubstition(this, elementToInsert);
        }

        public substitute(substitutions: Substitution[]): VariableDeclaration {
            return Common.firstOrDefault(substitutions, this,
                s => s.getDeclarationToSubstitute().equals(this) ? <VariableDeclaration>s.getElementToInsert() : null);
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

        public createSubstitution(elementToInsert: FunctionDeclaration) {
            return new FunctionSubstitution(this, elementToInsert);
        }

        public substitute(substitutions: Substitution[]): FunctionDeclaration {
            return Common.firstOrDefault(substitutions, this,
                s => s.getDeclarationToSubstitute().equals(this) ? <FunctionDeclaration>s.getElementToInsert() : null);
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

        public createSubstitution(elementToInsert: PredicateDeclaration) {
            return new PredicateSubstitution(this, elementToInsert);
        }

        public substitute(substitutions: Substitution[]): PredicateDeclaration {
            return Common.firstOrDefault(substitutions, this,
                s => s.getDeclarationToSubstitute().equals(this) ? <PredicateDeclaration>s.getElementToInsert() : null);
        }
    }


    export class TermDeclaration extends Declaration {
        public toString() {
            return "Term declaration of " + this.getName();
        }

        public createSubstitution(elementToInsert: Term) {
            return new TermSubstitution(this, elementToInsert);
        }

        public substitute(substitutions: Substitution[]): Term {
            return Common.firstOrDefault(substitutions, new TermRef(this),
                s => s.getDeclarationToSubstitute().equals(this) ? <Term>s.getElementToInsert() : null);
        }
    }

    export class FormulaDeclaration extends Declaration {

        public toString(): string {
            return "Formula declaration of " + this.getName();
        }

        public createSubstitution(elementToInsert: Formula) {
            return new FormulaSubstitution(this, elementToInsert);
        }

        public substitute(substitutions: Substitution[]): Formula {
            return Common.firstOrDefault(substitutions, new FormulaRef(this),
                s => s.getDeclarationToSubstitute().equals(this) ? <Formula>s.getElementToInsert() : null);
        }
    }
}