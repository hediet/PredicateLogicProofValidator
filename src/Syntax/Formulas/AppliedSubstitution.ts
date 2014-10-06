
module FirstOrderPredicateLogic.Syntax {

    export class AppliedSubstitution extends Formula {

        private formulaToSubstitute: Formula;
        private substitution: VariableWithTermSubstitution;

        private substitutedFormula: Formula = null;

        constructor(formulaToSubstitute: Formula, substitution: VariableWithTermSubstitution) {
            super();

            this.formulaToSubstitute = formulaToSubstitute;
            this.substitution = substitution;
        }

        public getFormulaToSubstitute(): Formula {
            return this.formulaToSubstitute;
        }

        public getSubstitution(): VariableWithTermSubstitution {
            return this.substitution;
        }

        public isCollisionFree(): boolean {
            return this.formulaToSubstitute.isSubstitutionCollisionFree(this.substitution);
        }

        public getSubstitutedFormula(): Formula {

            if (this.substitutedFormula === null) {
                this.substitutedFormula = this.formulaToSubstitute.substituteUnboundVariables([this.substitution]);
            }

            return this.substitutedFormula;
        }



        public isSubstitutionCollisionFree(substitution: VariableWithTermSubstitution): boolean {
            throw "This method is abstract";
        }

        public substituteUnboundVariables(substitutions: VariableWithTermSubstitution[]): Formula {
            throw "This method is abstract";
        }

        public substitute(substitutions: Substitution[]): Formula {

            var newVariableToSubstitute = Helper.firstOrDefault(substitutions, this.substitution.getVariableToSubstitute(),
                s => s.getDeclarationToSubstitute().equals(this.substitution.getVariableToSubstitute()) ? s.getElementToInsert() : null);

            var newTermToInsert = this.substitution.getTermToInsert().substitute(substitutions);

            var newFormulaToSubstitute = this.formulaToSubstitute.substitute(substitutions);

            return new AppliedSubstitution(newFormulaToSubstitute,
                new VariableWithTermSubstitution(newVariableToSubstitute, newTermToInsert));
        }

        public applySubstitutions(): Formula {

            return this.formulaToSubstitute.applySubstitutions().substituteUnboundVariables([this.substitution]);;
        }

        public getUnboundVariables(): VariableDeclaration[]{

            /*

            this.formulaToSubstitute.getUnboundVariables().filter(v => {
                if (v.equals(this.substitution.getVariableToSubstitute())) {

                } else return true;

            })
*/
            return [];
        }

        public getVariables(): VariableDeclaration[] {
            return []; //TODO
        }

        public getDeclarations(): Declaration[]{
            //TODO
            return this.formulaToSubstitute.getDeclarations();
        }

        public toString(args: IFormulaToStringArgs = defaultFormulaToStringArgs): string {

            var subArgs = {
                forceParenthesis: args.forceParenthesis,
                parentOperatorPriority: 100000,
                useUnicode: args.useUnicode
            };

            return this.formulaToSubstitute.toString(subArgs) + this.substitution.toString(args.useUnicode);
        }
    }
}