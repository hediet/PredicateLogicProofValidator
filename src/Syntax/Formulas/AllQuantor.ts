module FirstOrderPredicateLogic.Syntax {

    /**
     * Represents an all quantor.
     */
    export class AllQuantor extends Formula {

        public static getPriority() {
            return 1000;
        }

        private quantifiedFormula: Formula;
        private boundVariable: VariableDeclaration;

        constructor(boundVariable: VariableDeclaration, quantifiedFormula: Formula) {
            super();

            Helper.ArgumentExceptionHelper.ensureTypeOf(boundVariable, VariableDeclaration, "boundVariable");
            Helper.ArgumentExceptionHelper.ensureTypeOf(quantifiedFormula, Formula, "quantifiedFormula");

            this.boundVariable = boundVariable;
            this.quantifiedFormula = quantifiedFormula;
        }

        /**
         * Gets the variable which is bound by this quantor.
         */
        public getBoundVariable(): VariableDeclaration {
            return this.boundVariable;
        }

        /**
         * Gets the formula which is quantified by this quantor.
         */
        public getQuantifiedFormula(): Formula {
            return this.quantifiedFormula;
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

        private clone(newBoundVariable: VariableDeclaration, newQuantifiedFormula: Formula): AllQuantor {
            if (this.boundVariable !== newBoundVariable || this.quantifiedFormula !== newQuantifiedFormula)
                return new AllQuantor(newBoundVariable, newQuantifiedFormula);
            else
                return this;
        }

        public getDeclarations(): Declaration[] {
            var result = this.quantifiedFormula.getDeclarations();
            result.push(this.boundVariable);
            result = Helper.unique(result, r => r.getName());
            return result;
        }

        public getUnboundVariables(context: ConditionContext): VariableDeclaration[] {
            var result = this.quantifiedFormula.getUnboundVariables(context);
            result = result.filter(t => !t.equals(this.boundVariable));
            return result;
        }

        public containsUnboundVariable(variable: VariableDeclaration, context: ConditionContext): boolean {
            if (variable.equals(this.boundVariable))
                return false;
            return this.quantifiedFormula.containsUnboundVariable(variable, context);
        }

        public containsBoundVariable(variable: VariableDeclaration, context: ConditionContext): boolean {
            if (variable.equals(this.boundVariable))
                return true;
            return this.quantifiedFormula.containsBoundVariable(variable, context);
        }

        public processAppliedSubstitutions(context: ConditionContext): Formula {
            return this.clone(this.boundVariable, this.quantifiedFormula.processAppliedSubstitutions(context));
        }

        public isSubstitutionCollisionFree(substitution: VariableWithTermSubstitution, context: ConditionContext): boolean {
            if (substitution.getVariableToSubstitute().equals(this.boundVariable))
                return true; //only free variables can be replaced
            
            //If termToInsert replaces at least one variable in 'quantifiedFormula',
            //all variables of 'termToInsert' would appear in the quantified formula.
            //The substitution is not collision free, if the variable bound by this quantor appears
            //unbound in 'termToInsert'.
            if (substitution.getTermToInsert().containsVariable(this.boundVariable, context)
                && this.quantifiedFormula.containsUnboundVariable(substitution.getVariableToSubstitute(), context))
                return false;

            return this.quantifiedFormula.isSubstitutionCollisionFree(substitution, context);
        }

        public substituteUnboundVariables(substitutions: VariableWithTermSubstitution[], context: ConditionContext): Formula {
            //since this.boundVariable is not free any more, all substitutions which substitutes that variable will be ignored.
            var filteredSubstitutions = substitutions.filter(s => !s.getVariableToSubstitute().equals(this.boundVariable));
            return this.clone(this.boundVariable, this.quantifiedFormula.substituteUnboundVariables(filteredSubstitutions, context));
        }

        public substitute(substitutions: Substitution[]): Formula {
            var newBoundVariable = this.boundVariable.substitute(substitutions);
            return this.clone(newBoundVariable, this.quantifiedFormula.substitute(substitutions));
        }

        public resubstitute(concreteFormula: Formula, collector: ISubstitutionCollector) {
            if (!(concreteFormula instanceof AllQuantor)) {
                collector.addIncompatibleNodes(this, concreteFormula);
                return;
            }

            var concreteAllQuantor = <AllQuantor>concreteFormula;

            collector.addSubstitution(new VariableSubstition(this.boundVariable, concreteAllQuantor.getBoundVariable()));
            this.quantifiedFormula.resubstitute(concreteAllQuantor.getQuantifiedFormula(), collector);
        }
    }
}