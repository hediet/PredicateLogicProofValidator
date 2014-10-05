
module FirstOrderPredicateLogic.Syntax {

    export class AllQuantor extends Formula {

        public static getPriority() {
            return 1000;
        }

        private formula: Formula;
        private boundVariable: VariableDeclaration;

        constructor(boundVariable: VariableDeclaration, formula: Formula) {
            super();

            this.boundVariable = boundVariable;
            this.formula = formula;
        }

        public getBoundVariable(): VariableDeclaration {
            return this.boundVariable;
        }

        public getFormula(): Formula {
            return this.formula;
        }

        public isSubstitutionCollisionFree(substitution: VariableWithTermSubstitution): boolean {
            if (substitution.getVariableToSubstitute().equals(this.boundVariable))
                return true; //only free variables can be replaced

            //termToInsert would replace at least one variable in 'formula',
            //so all variables of 'termToInsert' would appear in the qualified formula.
            //The substitution is not collision free, if the variable bound by this qualifier appears
            //unbound in 'termToInsert'.
            if (substitution.getTermToInsert().containsVariable(this.boundVariable)
                && this.formula.containsUnboundVariable(substitution.getVariableToSubstitute()))
                return false;

            return this.formula.isSubstitutionCollisionFree(substitution);
        }

        public substituteUnboundVariables(substitutions: VariableWithTermSubstitution[]): Formula {

            var subs = substitutions.filter(s => !s.getVariableToSubstitute().equals(this.boundVariable));

            return new AllQuantor(this.boundVariable, this.formula.substituteUnboundVariables(subs));
        }

        public substitute(substitutions: Substition[]): Formula {

            var newBoundVariable = this.boundVariable;

            substitutions.some(s => {
                if (s instanceof VariableSubstition) {
                    var sub = <VariableSubstition>s;
                    if (sub.getDeclarationToSubstitute().equals(this.boundVariable)) {
                        newBoundVariable = sub.getVariableToInsert();
                        return true;
                    }
                }
                return false;
            });

            return new AllQuantor(newBoundVariable, this.formula.substitute(substitutions));
        }

        public resubstitute(instance: Formula, substService: ISubstitutionCollector) {

            if (!(instance instanceof AllQuantor)) {
                substService.addIncompatibleNodes(this, instance);
                return;
            }

            var a = <AllQuantor>instance;
            var boundVariable = a.getBoundVariable();

            substService.addSubstitution(new VariableSubstition(boundVariable, a.getBoundVariable()));
            this.formula.resubstitute(a.getFormula(), substService);
        }

        public applySubstitutions(): Formula {
            return new AllQuantor(this.boundVariable, this.formula.applySubstitutions());
        }

        public getDeclarations(): Declaration[] {

            var result: Declaration[] = this.formula.getDeclarations();
            result.push(this.boundVariable);
            result = Helper.unique(result, r => r.getName());

            return result;
        }

        public getUnboundVariables(): VariableDeclaration[] {
            var result = this.formula.getUnboundVariables();
            result = result.filter(t => !t.equals(this.boundVariable));

            return result;
        }

        public toString(args: IFormulaToStringArgs = defaultFormulaToStringArgs): string {

            var result = (args.useUnicode ? "∀" : "forall ") + this.boundVariable.getName() + ": " + this.formula.toString(
            {
                forceParenthesis: args.forceParenthesis,
                parentOperatorPriority: AllQuantor.getPriority(),
                useUnicode: args.useUnicode
            });

            if (args.forceParenthesis)
                result = "(" + result + ")";

            return result;
        }
    }
}