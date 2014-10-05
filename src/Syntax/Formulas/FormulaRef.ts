
module FirstOrderPredicateLogic.Syntax {

    export class FormulaRef extends Formula {

        private fd: FormulaDeclaration;

        constructor(fd: FormulaDeclaration) {
            super();
            this.fd = fd;
        }

        public getFormula(): FormulaDeclaration {
            return this.fd;
        }


        public isSubstitutionCollisionFree(substitution: VariableWithTermSubstitution): boolean {
            return true;
        }

        public substituteUnboundVariables(substitutions: VariableWithTermSubstitution[]): Formula {

            var result: Formula = this;
            substitutions.forEach(s => {
                result = new AppliedSubstitution(result, s.getVariableToSubstitute(), s.getTermToInsert());
            });

            return result;
        }

        public substitute(substitutions: Substition[]): Formula {

            var result: Formula = this;
            substitutions.some(s => {
                if (s instanceof FormulaSubstitution) {
                    var sub = <FormulaSubstitution>s;
                    if (sub.getDeclarationToSubstitute().equals(this.getFormula())) {
                        result = sub.getFormulaToInsert();
                        return true;
                    }
                }
                return false;
            });

            return result;
        }

        public resubstitute(instance: Formula, substService: ISubstitutionCollector) {
            substService.addSubstitution(new FormulaSubstitution(this.fd, instance));
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
            return [this.getFormula()];
        }

        public toString(args: IFormulaToStringArgs = defaultFormulaToStringArgs): string {
            return this.fd.getName();
        }
    }



}