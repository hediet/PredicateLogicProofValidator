
module FirstOrderPredicateLogic.Syntax {

    export class AllQuantor extends Formula {

        public static getPriority() {
            return 1000;
        }

        private quantifiedFormula: Formula;
        private boundVariable: VariableDeclaration;

        constructor(boundVariable: VariableDeclaration, quantifiedFormula: Formula) {
            super();

            this.boundVariable = boundVariable;
            this.quantifiedFormula = quantifiedFormula;
        }

        public getBoundVariable(): VariableDeclaration {
            return this.boundVariable;
        }

        public getQuantifiedFormula(): Formula {
            return this.quantifiedFormula;
        }

        public isSubstitutionCollisionFree(substitution: VariableWithTermSubstitution): boolean {
            if (substitution.getVariableToSubstitute().equals(this.boundVariable))
                return true; //only free variables can be replaced

            //termToInsert would replace at least one variable in 'formula',
            //so all variables of 'termToInsert' would appear in the qualified formula.
            //The substitution is not collision free, if the variable bound by this qualifier appears
            //unbound in 'termToInsert'.
            if (substitution.getTermToInsert().containsVariable(this.boundVariable)
                && this.quantifiedFormula.containsUnboundVariable(substitution.getVariableToSubstitute()))
                return false;

            return this.quantifiedFormula.isSubstitutionCollisionFree(substitution);
        }

        private clone(newBoundVariable: VariableDeclaration, newQuantifiedFormula: Formula): AllQuantor {
            if (this.boundVariable !== newBoundVariable || this.quantifiedFormula !== newQuantifiedFormula)
                return new AllQuantor(newBoundVariable, newQuantifiedFormula);
            else
                return this;
        }


        public substituteUnboundVariables(substitutions: VariableWithTermSubstitution[]): Formula {

            var subs = substitutions.filter(s => !s.getVariableToSubstitute().equals(this.boundVariable));
            return this.clone(this.boundVariable, this.quantifiedFormula.substituteUnboundVariables(subs));
        }

        public substitute(substitutions: Substition[]): Formula {

            var newBoundVariable = this.boundVariable;

            substitutions.some(s => {
                if (s instanceof VariableSubstition) {
                    var sub = <VariableSubstition>s;
                    if (sub.getDeclarationToSubstitute().equals(this.boundVariable)) {
                        newBoundVariable = sub.getElementToInsert();
                        return true;
                    }
                }
                return false;
            });

            return this.clone(newBoundVariable, this.quantifiedFormula.substitute(substitutions));
        }

        public resubstitute(instance: Formula, substService: ISubstitutionCollector) {

            if (!(instance instanceof AllQuantor)) {
                substService.addIncompatibleNodes(this, instance);
                return;
            }

            var a = <AllQuantor>instance;
            var boundVariable = a.getBoundVariable();

            substService.addSubstitution(new VariableSubstition(boundVariable, a.getBoundVariable()));
            this.quantifiedFormula.resubstitute(a.getQuantifiedFormula(), substService);
        }

        public applySubstitutions(): Formula {
            return this.clone(this.boundVariable, this.quantifiedFormula.applySubstitutions());
        }

        public getDeclarations(): Declaration[] {

            var result: Declaration[] = this.quantifiedFormula.getDeclarations();
            result.push(this.boundVariable);
            result = Helper.unique(result, r => r.getName());

            return result;
        }

        public getUnboundVariables(): VariableDeclaration[] {
            var result = this.quantifiedFormula.getUnboundVariables();
            result = result.filter(t => !t.equals(this.boundVariable));

            return result;
        }

        public toString(args: IFormulaToStringArgs = defaultFormulaToStringArgs): string {

            var result = (args.useUnicode ? "∀" : "forall ") + this.boundVariable.getName() + ": " + this.quantifiedFormula.toString(
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