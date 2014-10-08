﻿module FirstOrderPredicateLogic.Proof {






    export class System {

        private formulaBuilders: FormulaBuilder[];

        constructor(document: Document) {

            var formulaBuilders: { [id: string]: FormulaBuilder } = {};

            document.getDescriptions().forEach(d => {

                if (d instanceof AbstractAxiomDescription) {
                    var formulaBuilder = d.getFormulaBuilder();
                    (<any>d).__system_formulaBuilder = formulaBuilder;
                    formulaBuilders[d.getName()] = formulaBuilder;
                }
                else if (d instanceof AbstractRuleDescription) {
                    var rule = d.getFormulaBuilder();
                    (<any>d).__system_formulaBuilder = rule;
                    formulaBuilders[d.getName()] = rule;

                } else if (d instanceof TheoremDescription) {

                    var steps: { [id: string]: Step } = {};

                    var td = <TheoremDescription>d;

                    var context = new ConditionContext(td.getConditions());

                    formulaBuilders[d.getName()] = td.getFormulaBuilder();

                    td.getProofSteps().forEach(step => {
                        var newStep: Step;

                        var referencedOperation = formulaBuilders[step.getOperation()];

                        if (referencedOperation instanceof ProofableFormulaBuilder) {
                            var referencedFormulaBuilder = <ProofableFormulaBuilder>referencedOperation;

                            var args = step.getArguments().map(a => {
                                if (a instanceof StepRef) {
                                    var referencedStepName = (<StepRef>a).getReferencedStep();
                                    return steps[referencedStepName].getDeductedFormula();
                                }
                                return a;
                            });

                            newStep = new ProofableFormulaBuilderStep(referencedFormulaBuilder,
                                Syntax.Substitution.fromValues(referencedFormulaBuilder.getParameters(), args), context);
                        } else if (referencedOperation instanceof Rule) {
                            var referencedRule = <Rule>referencedOperation;

                            var stepArgs = step.getArguments().slice(0);
                            var providedAssumptions: StepRef[] = [];
                            referencedRule.getAssumptions().forEach(a => {
                                providedAssumptions.push(stepArgs.shift());
                            });

                            var providedAssumptionsSteps = providedAssumptions.map(s => steps[s.getReferencedStep()]);

                            newStep = new RuleStep(referencedRule, providedAssumptionsSteps,
                                Syntax.Substitution.fromValues(referencedRule.getNecessaryParameters(), stepArgs), context);
                        } else
                            throw "Referenced operation is not supported";

                        (<any>step).__system_step = newStep;
                        steps[step.getStepIdentifier()] = newStep;
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
            return (<any>step).__system_step;
        }


        public getIsProven(theorem: TheoremDescription) {

            var steps = theorem.getProofSteps();
            var lastStep = steps[steps.length - 1];
            var realStep = this.getStep(lastStep);

            var assertion = theorem.getAssertion();

            if (realStep.getHypotheses().length > 0)
                return false;

            return realStep.getDeductedFormula().equals(assertion);
        }
    }

















    export class FormulaBuilder {

        private name: string;
        private parameters: Syntax.Declaration[];
        private formulaTemplate: Syntax.Formula;
        private conditions: AppliedCondition[];

        constructor(name: string, placeholders: Syntax.Declaration[], formulaTemplate: Syntax.Formula, conditions: AppliedCondition[]) {
            this.name = name;
            this.parameters = placeholders;
            this.formulaTemplate = formulaTemplate;
            this.conditions = conditions;
        }

        public getName(): string {
            return this.name;
        }

        public getParameters(): Syntax.Declaration[] {
            return this.parameters;
        }

        public getFormulaTemplate(): Syntax.Formula {
            return this.formulaTemplate;
        }

        public getConditions(): AppliedCondition[] {
            return this.conditions;
        }

        public getHypotheses(assumptionHypotheses: Syntax.Formula[], args: Syntax.Substitution[], context: Syntax.ConditionContext): Syntax.Formula[] {
            return assumptionHypotheses;
        }
    }

    export class ProofableFormulaBuilder extends FormulaBuilder {

    }

    export class Axiom extends ProofableFormulaBuilder {

    }

    export class Theorem extends ProofableFormulaBuilder {

    }


    export class Rule extends FormulaBuilder {

        private assumptions: Syntax.Formula[];

        constructor(name: string, parameters: Syntax.Declaration[],
            formulaTemplate: Syntax.Formula, assumptions: Syntax.Formula[], conditions: AppliedCondition[]) {

            super(name, parameters, formulaTemplate, conditions);
            this.assumptions = assumptions;
        }

        public getAssumptions(): Syntax.Formula[] {
            return this.assumptions;
        }

        public getNecessaryParameters(): Syntax.Declaration[] {

            var usedDeclarations: { [id: string]: Syntax.Declaration } = {};
            this.assumptions.forEach(a => {
                a.getDeclarations().forEach(r => usedDeclarations[r.getName()] = r);
            });

            return this.getParameters().filter(p => !usedDeclarations.hasOwnProperty(p.getName()));
        }
    }


    export class HypothesisAxiom extends Axiom {

        constructor() {
            var phi = new Syntax.FormulaDeclaration("phi");

            super("Hypothesis", [phi], new Syntax.FormulaRef(phi), []);
        }

        public getHypotheses(assumptionHypotheses: Syntax.Formula[], args: Syntax.Substitution[], context: Syntax.ConditionContext): Syntax.Formula[] {

            var substitutedFormula = this.getFormulaTemplate().substitute(args);

            if (substitutedFormula.getUnboundVariables(context).length > 0)
                throw "Formula contains unbound variables!";

            return [substitutedFormula];
        }
    }

    export class DeductionRule extends Rule {

        private phiFormula: Syntax.Formula;

        constructor() {

            var phi = new Syntax.FormulaDeclaration("phi");
            var psi = new Syntax.FormulaDeclaration("psi");

            this.phiFormula = new Syntax.FormulaRef(phi);

            super("Deduction", [phi, psi],
                Syntax.Implication.factory.createInstance([this.phiFormula, new Syntax.FormulaRef(psi)]),
                [new Syntax.FormulaRef(psi)], []);
        }

        public getHypotheses(assumptionHypotheses: Syntax.Formula[], args: Syntax.Substitution[]): Syntax.Formula[] {

            var phi2 = this.phiFormula.substitute(args);
            var assumption = Common.firstOrDefault(assumptionHypotheses, null, h => h.equals(phi2) ? h : null);

            if (assumption === null)
                throw "Invalid assumption!";

            return assumptionHypotheses.filter(a => !a.equals(phi2));
        }
    }


    export class Step {
        public getDeductedFormula(): Syntax.Formula {
            throw "abstract";
        }

        public getHypotheses(): Syntax.Formula[] {
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
                    throw "condition not met!";
            });

            this.context = context;
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
                throw "substitution error!";

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
                        throw "substitution error";
                } else {
                    newArgs.push(arg);
                }

            });

            this.args = newArgs;


            var hypotheses = Common.uniqueJoin(assumptions, step => step.getHypotheses(), f => f.toString());
            this.hypotheses = this.rule.getHypotheses(hypotheses, newArgs, context);
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



    class SubstitutionCollector implements Syntax.ISubstitutionCollector {

        private error: boolean;
        private substitutions: { [id: string]: Syntax.Substitution } = {};

        public getIsError(): boolean {
            return this.error;
        }

        public getSubstitutions(): Syntax.Substitution[] {

            var result: Syntax.Substitution[] = [];

            for (var propt in this.substitutions) {
                result.push(this.substitutions[propt]);
            }

            return result;
        }

        public addSubstitution(substitution: Syntax.Substitution) {

            var name = substitution.getDeclarationToSubstitute().getName();
            var oldSubst = this.substitutions[name];

            if (typeof oldSubst === "undefined") {
                this.substitutions[name] = substitution;
            } else if (!substitution.equals(oldSubst)) {
                this.error = true;
            }
        }

        public addIncompatibleNodes(genericFormula: Syntax.Formula, specialFormula: Syntax.Formula) {
            this.error = true;
        }
    }

}

