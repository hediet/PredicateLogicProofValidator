module FirstOrderPredicateLogic.Proof {

    export class Step {
        public getDeductedFormula(): Syntax.Formula {
            throw "abstract";
        }

        public getHypotheses(): Syntax.Formula[] {
            throw "abstract";
        }

        public getArguments(): Syntax.Substitution[] {
            throw "abstract";
        }

        public getContext(): Syntax.ConditionContext {
            throw "abstract";
        }
    }


    export class ProofableFormulaBuilderStep extends Step {

        private pfb: ProofableFormulaBuilder;
        private args: Syntax.Substitution[];
        private context: Syntax.ConditionContext;

        constructor(pfb: ProofableFormulaBuilder, args: Syntax.Substitution[], context: Syntax.ConditionContext) {
            super();
            this.pfb = pfb;
            this.args = args;

            pfb.getConditions().forEach(c => {
                if (!c.check(this.args, context))
                    throw "condition '" + c.getCondition().getName() + "' not met!";
            });

            this.context = context;
        }

        public getContext(): Syntax.ConditionContext {
            return this.context;
        }

        public getArguments(): Syntax.Substitution[] {
            return this.args;
        }

        public getProofableFormulaBuilder(): ProofableFormulaBuilder {
            return this.pfb;
        }

        public getDeductedFormula(): Syntax.Formula {

            return this.pfb.getFormulaTemplate().substitute(this.args).processAppliedSubstitutions(this.context);
        }

        public getHypotheses(): Syntax.Formula[] {
            return this.pfb.getHypotheses([], this.args, this.context);
        }
    }

    export class RuleStep extends Step {

        private rule: Rule;
        private args: Syntax.Substitution[];
        private assumptions: Step[];
        private hypotheses: Syntax.Formula[];
        private context: Syntax.ConditionContext;

        constructor(rule: Rule, assumptions: Step[], args: Syntax.Substitution[], context: Syntax.ConditionContext) {
            super();
            this.rule = rule;
            this.assumptions = assumptions;

            //check assumptions and infer arguments

            var substService = new SubstitutionCollector();

            rule.getAssumptions().forEach((a: Syntax.Formula, idx) => {
                var providedAssumption = assumptions[idx];
                a.resubstitute(providedAssumption.getDeductedFormula(), substService);
            });

            if (substService.getIsError())
                throw "substitution error: " + substService.getConflicts().map(c => c.toString()).join(", ");

            var newArgs: Syntax.Substitution[] = [];
            var indexedArgs: { [id: string]: Syntax.Substitution } = {};

            var parameters: { [id: string]: Syntax.Declaration } = {};

            rule.getParameters().forEach(p => {
                parameters[p.getName()] = p;
            });

            //check against provided arguments
            substService.getSubstitutions().forEach(subst => {
                newArgs.push(subst);
                indexedArgs[subst.getDeclarationToSubstitute().getName()] = subst;
            });


            args.forEach(arg => {

                var name = arg.getDeclarationToSubstitute().getName();

                if (indexedArgs.hasOwnProperty(arg.getDeclarationToSubstitute().getName())) {
                    if (!indexedArgs[name].equals(arg))
                        throw "substitution error"; //should not happen if only necessary arguments are provided
                } else {
                    newArgs.push(arg);
                }

            });

            this.args = newArgs;

            rule.getConditions().forEach(c => {
                if (c.getCondition() instanceof IsNotFreeInHypothesisCondition) {
                    var variableParam = <Syntax.VariableDeclaration>c.getArguments()[0];
                    var variableArg = variableParam.substitute(this.args);

                    if (this.assumptions.some(a => a.getHypotheses().some(h => h.containsUnboundVariable(variableArg, context))))
                        throw "condition '" + c.getCondition().getName() + "' not met!";
                }

                if (!c.check(this.args, context))
                    throw "condition '" + c.getCondition().getName() + "' not met!";
            });


            this.context = context;


            var hypotheses = Common.uniqueJoin(assumptions, step => step.getHypotheses(), f => f.toString());
            this.hypotheses = this.rule.getHypotheses(hypotheses, newArgs, context);
        }

        public getContext(): Syntax.ConditionContext {
            return this.context;
        }

        public getArguments(): Syntax.Substitution[] {
            return this.args;
        }

        public getRule(): Rule {
            return this.rule;
        }

        public getAssumptions(): Step[] {
            return this.assumptions;
        }

        public getDeductedFormula(): Syntax.Formula {

            return this.rule.getFormulaTemplate().substitute(this.args);
        }

        public getHypotheses(): Syntax.Formula[] {
            return this.hypotheses;
        }
    }

}