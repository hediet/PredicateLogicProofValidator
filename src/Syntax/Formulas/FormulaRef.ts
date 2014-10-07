module FirstOrderPredicateLogic.Syntax {

    export class FormulaRef extends Formula {

        private formulaDeclaration: FormulaDeclaration;

        constructor(formulaDeclaration: FormulaDeclaration) {
            super();

            Helper.ArgumentExceptionHelper.ensureTypeOf(formulaDeclaration, FormulaDeclaration, "formulaDeclaration");

            this.formulaDeclaration = formulaDeclaration;
        }

        public getFormulaDeclaration(): FormulaDeclaration {
            return this.formulaDeclaration;
        }

        public isSubstitutionCollisionFree(substitution: VariableWithTermSubstitution): boolean {

            if (!this.containsUnboundVariable(substitution.getVariableToSubstitute()))
                return true;

            //todo
            return true;
        }

        public substituteUnboundVariables(substitutions: VariableWithTermSubstitution[]): Formula {
            //todo
            return substitutions.reduce<Formula>((last, s) => new AppliedSubstitution(last, s), this);
        }

        public substitute(substitutions: Substitution[]): Formula {
            return this.formulaDeclaration.substitute(substitutions);
        }

        public resubstitute(concreteFormula: Formula, collector: ISubstitutionCollector) {
            collector.addSubstitution(new FormulaSubstitution(this.formulaDeclaration, concreteFormula));
        }

        public processAppliedSubstitutions(): Formula {
            return this;
        }

        public getUnboundVariables(): VariableDeclaration[]{
            //todo
            return [];
        }

        public containsUnboundVariable(variable: VariableDeclaration): boolean {
            //todo
            return false;
        }

        public containsBoundVariable(variable: VariableDeclaration): boolean {
            //todo
            return false;
        }

        public getDeclarations(): Declaration[] {
            return [this.getFormulaDeclaration()];
        }

        public toString(args: IFormulaToStringArgs = defaultFormulaToStringArgs): string {
            return this.formulaDeclaration.getName();
        }
    }
}