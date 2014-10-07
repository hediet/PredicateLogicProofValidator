module FirstOrderPredicateLogic.Syntax {

    export class Substitution {

        public isIdentity(): boolean {
            throw "abstract";
        }

        public getDeclarationToSubstitute(): Declaration {
            throw "abstract";
        }

        public getElementToInsert(): Node {
            throw "abstract";
        }

        public equals(other: Substitution): boolean {
            throw "abstract";
        }

        public static fromValues(declarations: Declaration[], elementsToInsert: any[]): Substitution[] {
            return declarations.map((d, idx) => d.createSubstitution(elementsToInsert[idx]));
        }
    }

    export class SpecificSubstitution<TDeclaration extends Declaration, TElementToInsert extends Node> extends Substitution {
        
        private declarationToSubstitute: TDeclaration;
        private elementToInsert: TElementToInsert;

        constructor(declarationToSubstitute: TDeclaration, elementToInsert: TElementToInsert) {
            super();

            this.declarationToSubstitute = declarationToSubstitute;
            this.elementToInsert = elementToInsert;
        }

        public getDeclarationToSubstitute(): TDeclaration {
            return this.declarationToSubstitute;
        }

        public getElementToInsert(): TElementToInsert {
            return this.elementToInsert;
        }

        public equals(other: Substitution): boolean {

            if (!(typeof this === typeof other))
                return false;

            if (!this.declarationToSubstitute.equals(other.getDeclarationToSubstitute()))
                return false;

            return this.getElementToInsert().equals(other.getElementToInsert());
        }
    }

    export class SimpleSubstitution<T extends Declaration> extends SpecificSubstitution<T, T> {
        public isIdentity(): boolean {
            return this.getDeclarationToSubstitute().equals(this.getElementToInsert());
        }
    }

    export class VariableSubstition extends SimpleSubstitution<VariableDeclaration> {
        constructor(declarationToSubstitute: VariableDeclaration, elementToInsert: VariableDeclaration) {
            Helper.ArgumentExceptionHelper.ensureTypeOf(declarationToSubstitute, VariableDeclaration, "declarationToSubstitute");
            Helper.ArgumentExceptionHelper.ensureTypeOf(elementToInsert, VariableDeclaration, "elementToInsert");

            super(declarationToSubstitute, elementToInsert);
        }
    }

    export class FunctionSubstitution extends SimpleSubstitution<FunctionDeclaration> {
        constructor(declarationToSubstitute: FunctionDeclaration, elementToInsert: FunctionDeclaration) {
            Helper.ArgumentExceptionHelper.ensureTypeOf(declarationToSubstitute, FunctionDeclaration, "declarationToSubstitute");
            Helper.ArgumentExceptionHelper.ensureTypeOf(elementToInsert, FunctionDeclaration, "elementToInsert");

            super(declarationToSubstitute, elementToInsert);
        }
    }

    export class TermSubstitution extends SpecificSubstitution<TermDeclaration, Term> {

        constructor(declarationToSubstitute: TermDeclaration, elementToInsert: Term) {
            Helper.ArgumentExceptionHelper.ensureTypeOf(declarationToSubstitute, TermDeclaration, "declarationToSubstitute");
            Helper.ArgumentExceptionHelper.ensureTypeOf(elementToInsert, Term, "elementToInsert");

            super(declarationToSubstitute, elementToInsert);
        }

        public isIdentity(): boolean {

            if (!(this.getElementToInsert() instanceof TermRef))
                return false;

            var termRefToInsert = <TermRef>this.getElementToInsert();
            return termRefToInsert.getTermDeclaration().equals(this.getDeclarationToSubstitute());
        }
    }


    export class PredicateSubstitution extends SimpleSubstitution<PredicateDeclaration> {
        constructor(declarationToSubstitute: PredicateDeclaration, elementToInsert: PredicateDeclaration) {
            Helper.ArgumentExceptionHelper.ensureTypeOf(declarationToSubstitute, PredicateDeclaration, "declarationToSubstitute");
            Helper.ArgumentExceptionHelper.ensureTypeOf(elementToInsert, PredicateDeclaration, "elementToInsert");

            super(declarationToSubstitute, elementToInsert);
        }
    }

    export class FormulaSubstitution extends SpecificSubstitution<FormulaDeclaration, Formula> {

        constructor(declarationToSubstitute: FormulaDeclaration, elementToInsert: Formula) {
            Helper.ArgumentExceptionHelper.ensureTypeOf(declarationToSubstitute, FormulaDeclaration, "declarationToSubstitute");
            Helper.ArgumentExceptionHelper.ensureTypeOf(elementToInsert, Formula, "elementToInsert");

            super(declarationToSubstitute, elementToInsert);
        }

        public isIdentity(): boolean {

            if (!(this.getElementToInsert() instanceof FormulaRef))
                return false;

            var formulaRefToInsert = <FormulaRef>this.getElementToInsert();
            return formulaRefToInsert.getFormulaDeclaration().equals(this.getDeclarationToSubstitute());
        }
    }
}