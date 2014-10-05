
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

            var result: Formula = this;
            substitutions.forEach(s => {
                result = new AppliedSubstitution(result, s);
            });

            return result;
        }

        public substitute(substitutions: Substition[]): Formula {

            var result: Formula = this;
            substitutions.some(s => {
                if (s instanceof FormulaSubstitution) {
                    var sub = <FormulaSubstitution>s;
                    if (sub.getDeclarationToSubstitute().equals(this.getDeclaration())) {
                        result = sub.getElementToInsert();
                        return true;
                    }
                }
                return false;
            });

            return result;
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

        public getFormulaRefs(): FormulaDeclaration[] {
            return [this.getDeclaration()];
        }

        public toString(args: IFormulaToStringArgs = defaultFormulaToStringArgs): string {
            return this.declaration.getName();
        }
    }
}