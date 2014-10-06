
module FirstOrderPredicateLogic.Syntax {

    export class FormulaRef extends Formula {

        private declaration: FormulaDeclaration;

        constructor(fd: FormulaDeclaration) {
            super();
            this.declaration = fd;
        }

        public getDeclaration(): FormulaDeclaration {
            return this.declaration;
        }

        public isSubstitutionCollisionFree(substitution: VariableWithTermSubstitution): boolean {
            //todo
            return true;
        }

        public substituteUnboundVariables(substitutions: VariableWithTermSubstitution[]): Formula {

            return substitutions.reduce<Formula>((last, s) => new AppliedSubstitution(last, s), this);
        }

        public substitute(substitutions: Substitution[]): Formula {

            return Helper.firstOrDefault(substitutions, this,
                s => s.getDeclarationToSubstitute().equals(this.declaration) ? s.getElementToInsert() : null);
        }

        public resubstitute(instance: Formula, substService: ISubstitutionCollector) {
            substService.addSubstitution(new FormulaSubstitution(this.declaration, instance));
        }

        public applySubstitutions(): Formula {
            return this;
        }

        public getUnboundVariables(): VariableDeclaration[] {
            return [];
        }

        public getVariables(): VariableDeclaration[] {
            throw "This method is abstract";
        }

        public getDeclarations(): Declaration[] {
            return [this.getDeclaration()];
        }

        public toString(args: IFormulaToStringArgs = defaultFormulaToStringArgs): string {
            return this.declaration.getName();
        }
    }
}