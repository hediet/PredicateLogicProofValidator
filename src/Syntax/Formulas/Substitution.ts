
module FirstOrderPredicateLogic.Syntax {

    export class Substition implements IEquatable<Substition> {

        public isIdentity(): boolean {
            throw "abstract";
        }

        public getDeclarationToSubstitute(): Declaration {
            throw "abstract";
        }

        public getElementToInsert(): any {
            throw "abstract";
        }

        public equals(other: Substition): boolean {
            throw "abstract";
        }

        public static fromValues(declarations: Declaration[], elementsToInsert: any[]): Substition[] {
            return declarations.map((d, idx) => d.createSubstitution(elementsToInsert[idx]));
        }
    }

    export class SpecificSubstitution<TDeclaration extends Declaration, TElementToInsert extends IEquatable<any>> extends Substition {
        
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

        public equals(other: Substition): boolean {

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

    export class VariableSubstition extends SimpleSubstitution<VariableDeclaration> { }

    export class FunctionSubstitution extends SimpleSubstitution<FunctionDeclaration> { }

    export class TermSubstitution extends SpecificSubstitution<TermDeclaration, Term> {

        public isIdentity(): boolean {

            if (!(this.getElementToInsert() instanceof TermRef))
                return false;

            var termRefToInsert = <TermRef>this.getElementToInsert();
            return termRefToInsert.getDeclaration().equals(this.getDeclarationToSubstitute());
        }
    }


    export class PredicateSubstitution extends SimpleSubstitution<PredicateDeclaration> { }

    export class FormulaSubstitution extends SpecificSubstitution<FormulaDeclaration, Formula> {

        public isIdentity(): boolean {

            if (!(this.getElementToInsert() instanceof FormulaRef))
                return false;

            var formulaRefToInsert = <FormulaRef>this.getElementToInsert();
            return formulaRefToInsert.getDeclaration().equals(this.getDeclarationToSubstitute());
        }
    }
}