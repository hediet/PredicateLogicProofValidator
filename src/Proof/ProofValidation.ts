module FirstOrderPredicateLogic.Proof {
    import ConditionContext = FirstOrderPredicateLogic.Syntax.ConditionContext;

    export class ProofValidation {

        private formulaBuilders: { [id: string]: FormulaBuilder } = {};
        private descriptionHashtable = new HashMap<Description, FormulaBuilder>();
        private stepHashtable = new HashMap<DocumentStep, Step>();

        constructor(document: Document, logger: Logger) {

            document.getDescriptions().forEach(d => this.processDescription(d, logger));
        }


        private processDescription(d: Description, logger: Logger) {

            if (d instanceof AbstractAxiomDescription) {
                this.processAxiomDescription(d, logger);
            } else if (d instanceof AbstractRuleDescription) {
                this.processRuleDescription(<AbstractRuleDescription>d, logger);
            } else if (d instanceof TheoremDescription) {
                this.processTheoremDescription(<TheoremDescription>d, logger);
            }
        }


        private processAxiomDescription(d: AbstractAxiomDescription, logger: Logger) {

            var formulaBuilder = d.getFormulaBuilder(logger);
            this.descriptionHashtable.set(d, formulaBuilder);
            if (formulaBuilder !== null) {
                this.formulaBuilders[d.getName().getIdentifier()] = formulaBuilder;
            }
        }

        private processRuleDescription(d: AbstractRuleDescription, logger: Logger) {

            var rule = d.getFormulaBuilder(logger);
            this.descriptionHashtable.set(d, rule);
            if (rule !== null) {
                this.formulaBuilders[d.getName().getIdentifier()] = rule;
            }
        }


        private processTheoremDescription(td: TheoremDescription, logger: Logger) {

            var steps: { [id: string]: Step } = {};

            var context = new ConditionContextImplementation(td.getConditions());

            var fb = td.getFormulaBuilder(logger);
            if (fb !== null)
                this.formulaBuilders[td.getName().getIdentifier()] = fb;

            td.getProofSteps().forEach(step => {
                try {
                    if (step.getOperation() === null) {
                        logger.logError("The step specifies no operation", step);
                        return;
                    }

                    var newStep: Step;
                    var referencedOperation = this.formulaBuilders[step.getOperation().getIdentifier()];
                    if (referencedOperation instanceof ProofableFormulaBuilder) {
                        newStep = this.processProofableFormulaBuilderStep(referencedOperation, step, steps, context, logger);
                    } else if (referencedOperation instanceof Rule) {
                        newStep = this.processProofableRuleStep(<Rule>referencedOperation, step, steps, context, logger);
                    } else
                        logger.logError("The step references an unknown operation", step.getOperation());

                    if (newStep !== null) {
                        newStep.getHypotheses(); //to throw possible exceptions

                        this.stepHashtable.set(step, newStep);
                        steps[step.getStepIdentifier().getIdentifier()] = newStep;
                    }
                } catch (e) {
                    logger.logError("An error occurred: " + e, step);
                }
            });
        }



        private processProofableFormulaBuilderStep(referencedFormulaBuilder: ProofableFormulaBuilder,
            step: DocumentStep, steps: { [id: string]: Step }, context: ConditionContext, logger: Logger): Step {

            var args = step.getArguments().map(a => {
                if (a instanceof StepRef) {
                    var referencedStepName = (<StepRef>a).getReferencedStep();
                    return steps[referencedStepName.getIdentifier()].getDeductedFormula();
                }
                return a;
            });

            return new ProofableFormulaBuilderStep(referencedFormulaBuilder,
                Syntax.Substitution.fromValues(referencedFormulaBuilder.getParameters(), args), context);
        }



        private processProofableRuleStep(referencedRule: Rule,
            step: DocumentStep, steps: { [id: string]: Step }, context: ConditionContext, logger: Logger): Step {

            var cancel = false;
            var stepArgs = Common.cloneArray(step.getArguments());

            var providedAssumptions = referencedRule.getAssumptions().map(assumption => {
                var referencedStep = <StepRef>stepArgs.shift();
                var referencedStepIdentifier = referencedStep.getReferencedStep().getIdentifier();

                if (typeof steps[referencedStepIdentifier] === "undefined") {
                    cancel = true;
                    logger.logError("Referenced step '" + referencedStepIdentifier + "' does not exist",
                        referencedStep.getReferencedStep());

                    return null;
                }

                return steps[referencedStep.getReferencedStep().getIdentifier()];
            });

            if (cancel)
                return null;

            return new RuleStep(referencedRule, providedAssumptions,
                Syntax.Substitution.fromValues(referencedRule.getNecessaryParameters(), stepArgs), context);
        }







        public getFormulaBuilderByName(name: string): FormulaBuilder {
            return this.formulaBuilders[name];
        }

        public getFormulaBuilder(description: Description): FormulaBuilder {
            return this.descriptionHashtable.get(description);
        }

        public getStep(step: DocumentStep): Step {

            if (!this.stepHashtable.has(step))
                return null;

            return this.stepHashtable.get(step);
        }


        public getIsProven(theorem: TheoremDescription) {

            var steps = theorem.getProofSteps();
            if (steps.length === 0)
                return false;
            var lastStep = steps[steps.length - 1];
            var realStep = this.getStep(lastStep);

            var assertion = theorem.getAssertion();

            if (realStep === null || realStep.getHypotheses().length > 0)
                return false;

            return realStep.getDeductedFormula().equals(assertion);
        }
    }
}