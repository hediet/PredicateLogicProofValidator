
module FirstOrderPredicateLogic.Syntax {

    export class AppliedSubstitution extends Formula {

        private formulaToSubstitute: Formula;
        private variableToSubstitute: VariableDeclaration;
        private termToInsert: Term;

        private substitutedFormula: Formula = null;

        constructor(formulaToSubstitute: Formula, variableToSubstitute: VariableDeclaration, termToInsert: Term) {
            super();

            this.formulaToSubstitute = formulaToSubstitute;
            this.variableToSubstitute = variableToSubstitute;
            this.termToInsert = termToInsert;
        }

        public getFormulaToSubstitute(): Formula {
            return this.formulaToSubstitute;
        }

        public getVariableToSubstitute(): VariableDeclaration {
            return this.variableToSubstitute;
        }

        public getTermToInsert(): Term {
            return this.termToInsert;
        }

        public isCollisionFree(): boolean {
            return this.formulaToSubstitute.isSubstitutionCollisionFree(
                new VariableWithTermSubstitution(this.variableToSubstitute, this.termToInsert));
        }

        public getSubstitutedFormula(): Formula {

            if (this.substitutedFormula === null) {
                this.substitutedFormula = this.formulaToSubstitute.substituteUnboundVariables(
                    [new VariableWithTermSubstitution(this.variableToSubstitute, this.termToInsert)]);
            }

            return this.substitutedFormula;
        }




        public isSubstitutionCollisionFree(substitution: VariableWithTermSubstitution): boolean {
            throw "This method is abstract";
        }

        public substituteUnboundVariables(substitutions: VariableWithTermSubstitution[]): Formula {
            throw "This method is abstract";
        }

        public substitute(substitutions: Substition[]): Formula {

            var newVariableToSubstitute = this.variableToSubstitute;

            substitutions.forEach(s => {
                if (s instanceof VariableSubstition) {
                    var s1 = <VariableSubstition>s;
                    if (s1.getDeclarationToSubstitute().equals(this.variableToSubstitute)) {
                        newVariableToSubstitute = s1.getVariableToInsert();
                    }
                }
            });

            var subs = substitutions.filter(s => s instanceof VariableSubstition).map(s =>
                new VariableWithTermSubstitution((<VariableSubstition>s).getDeclarationToSubstitute(),
                    new VariableRef((<VariableSubstition>s).getVariableToInsert())));

            var newTermToInsert = this.termToInsert.substitute(subs);
            var newFormulaToSubstitute = this.formulaToSubstitute.substitute(substitutions);

            return new AppliedSubstitution(newFormulaToSubstitute, newVariableToSubstitute, newTermToInsert);
        }

        public applySubstitutions(): Formula {
            return this.getSubstitutedFormula();
        }

        public getUnboundVariables(): VariableDeclaration[] {
            return [];
        }

        public getVariables(): VariableDeclaration[] {
            return []; //TODO
        }

        public getFormulaRefs(): FormulaDeclaration[] {
            return []; //TODO
        }

        public toString(args: IFormulaToStringArgs = defaultFormulaToStringArgs): string {

            var subArgs = {
                forceParenthesis: args.forceParenthesis,
                parentOperatorPriority: 0,
                useUnicode: args.useUnicode
            };

            return "(" + this.formulaToSubstitute.toString(subArgs) + ")"
                + "[" + this.variableToSubstitute.getName() + " <- " + this.termToInsert.toString() + "]";
        }
    }
}