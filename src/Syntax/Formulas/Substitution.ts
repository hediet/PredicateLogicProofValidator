
module FirstOrderPredicateLogic.Syntax {

    export class Substition {

        private declarationToSubstitute: VariableDeclaration;

        constructor(declarationToSubstitute: VariableDeclaration) {
            this.declarationToSubstitute = declarationToSubstitute;
        }

        public isIdentity(): boolean {
            throw "abstract";
        }

        public getDeclarationToSubstitute(): FormulaDeclaration {
            return this.declarationToSubstitute;
        }

        public equals(other: Substition): boolean {
            if (!(typeof this === typeof other))
                return false;

            return this.declarationToSubstitute.equals(other.declarationToSubstitute);
        }
    }

    export class VariableSubstition extends Substition {

        
        private variableToInsert: VariableDeclaration;

        constructor(variableToSubstitute: VariableDeclaration, variableToInsert: VariableDeclaration) {

            Helper.ArgumentExceptionHelper.ensureTypeOf(variableToSubstitute, VariableDeclaration, "variableToSubstitute");
            Helper.ArgumentExceptionHelper.ensureTypeOf(variableToInsert, VariableDeclaration, "variableToInsert");

            super(variableToSubstitute);
            this.variableToInsert = variableToInsert;
        }

        public getVariableToInsert(): VariableDeclaration {
            return this.variableToInsert;
        }

        public isIdentity(): boolean {
            return this.getDeclarationToSubstitute().equals(this.variableToInsert);
        }

        public equals(other: Substition): boolean {
            return super.equals(other)
                && this.variableToInsert.equals((<VariableSubstition>other).variableToInsert);
        }
    }

    export class FormulaSubstitution extends Substition {

        private formulaToInsert: Formula;

        constructor(formulaToSubstitute: FormulaDeclaration, formulaToInsert: Formula) {

            Helper.ArgumentExceptionHelper.ensureTypeOf(formulaToSubstitute, FormulaDeclaration, "formulaToSubstitute");
            Helper.ArgumentExceptionHelper.ensureTypeOf(formulaToInsert, Formula, "formulaToInsert");

            super(formulaToSubstitute);
            this.formulaToInsert = formulaToInsert;
        }

        public getFormulaToInsert(): Formula {
            return this.formulaToInsert;
        }
        
        public isIdentity(): boolean {

            if (!(this.formulaToInsert instanceof FormulaRef)) 
                return false;

            var formulaRefToInsert = <FormulaRef>this.formulaToInsert;
            return formulaRefToInsert.getFormula().equals(this.getDeclarationToSubstitute());
        }

        public equals(other: Substition): boolean {
            return super.equals(other)
                && this.formulaToInsert.equals((<FormulaSubstitution>other).formulaToInsert);
        }
    }
}