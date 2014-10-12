module FirstOrderPredicateLogic.Proof {

    export class System {

        private formulaBuilders: FormulaBuilder[];

        constructor(document: Document, logger: Logger) {

            var formulaBuilders: { [id: string]: FormulaBuilder } = {};

            document.getDescriptions().forEach(d => {

                if (d instanceof AbstractAxiomDescription) {

                    var formulaBuilder = d.getFormulaBuilder(logger);
                    (<any>d).__system_formulaBuilder = formulaBuilder;

                    if (formulaBuilder !== null) {
                        formulaBuilders[d.getName().getIdentifier()] = formulaBuilder;
                    }
                } else if (d instanceof AbstractRuleDescription) {
                    var rule = d.getFormulaBuilder(logger);
                    (<any>d).__system_formulaBuilder = rule;
                    if (rule !== null) {
                        formulaBuilders[d.getName().getIdentifier()] = rule;
                    }
                } else if (d instanceof TheoremDescription) {

                    var steps: { [id: string]: Step } = {};

                    var td = <TheoremDescription>d;

                    var context = new ConditionContext(td.getConditions());

                    var fb = td.getFormulaBuilder(logger);
                    if (fb !== null)
                        formulaBuilders[d.getName().getIdentifier()] = fb;

                    td.getProofSteps().forEach(step => {
                        try {
                            var newStep: Step;

                            if (step.getOperation() === null) {
                                logger.logError("The step specifies no operation", step);
                                return;
                            }

                            var referencedOperation = formulaBuilders[step.getOperation().getIdentifier()];


                            if (referencedOperation instanceof ProofableFormulaBuilder) {
                                var referencedFormulaBuilder = <ProofableFormulaBuilder>referencedOperation;

                                var args = step.getArguments().map(a => {
                                    if (a instanceof StepRef) {
                                        var referencedStepName = (<StepRef>a).getReferencedStep();
                                        return steps[referencedStepName.getIdentifier()].getDeductedFormula();
                                    }
                                    return a;
                                });

                                newStep = new ProofableFormulaBuilderStep(referencedFormulaBuilder,
                                    Syntax.Substitution.fromValues(referencedFormulaBuilder.getParameters(), args), context);
                            } else if (referencedOperation instanceof Rule) {
                                var referencedRule = <Rule>referencedOperation;

                                var cancel = false;

                                var stepArgs = step.getArguments().slice(0);
                                var providedAssumptions: StepRef[] = [];
                                referencedRule.getAssumptions().forEach(a => {
                                    var providedAssumption = stepArgs.shift();
                                    if (typeof steps[providedAssumption.getReferencedStep().getIdentifier()] === "undefined") {
                                        cancel = true;
                                        logger.logError("Referenced step '" + providedAssumption.getReferencedStep().getIdentifier() + "' does not exist",
                                            providedAssumption.getReferencedStep());
                                    }
                                    providedAssumptions.push(providedAssumption);
                                });

                                if (cancel)
                                    return;

                                var providedAssumptionsSteps = providedAssumptions.map(s => steps[s.getReferencedStep().getIdentifier()]);

                                newStep = new RuleStep(referencedRule, providedAssumptionsSteps,
                                    Syntax.Substitution.fromValues(referencedRule.getNecessaryParameters(), stepArgs), context);
                            } else
                                logger.logError("The step references an unknown operation", step.getOperation());

                            newStep.getHypotheses(); //to throw possible exceptions ;)

                            (<any>step).__system_step = newStep;
                            steps[step.getStepIdentifier().getIdentifier()] = newStep;
                        } catch (e) {
                            logger.logError("An error occurred: " + e, step);
                        }
                    });
                }
            });
        }


        public getFormulaBuilders(): FormulaBuilder[] {
            return this.formulaBuilders;
        }

        public getFormulaBuilder(description: Description) {
            return (<any>description).__system_formulaBuilder;
        }

        public getStep(step: ProofStep): Step {

            if (typeof (<any>step).__system_step === "undefined")
                return null;

            return (<any>step).__system_step;
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