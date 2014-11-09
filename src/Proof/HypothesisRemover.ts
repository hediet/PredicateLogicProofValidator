module FirstOrderPredicateLogic.Proof {
    import FormulaSubstitution = Syntax.FormulaSubstitution;
    import Substitution = Syntax.Substitution;
    import Formula = Syntax.Formula;
    
    export class HypothesisRemover {

        constructor(private ax1: Axiom,
            private ax2: Axiom,
            private ruleMp: Rule,
            private tImpSym: Theorem) {

        }

        private removeHypothesis(step: Step, hypothesis: Formula, context: Syntax.ConditionContext, hashMap: HashMap<Step, Step>): Step {

            if (hashMap.has(step))
                return hashMap.get(step);

            if (step instanceof ProofableFormulaBuilderStep) {
                var p = <ProofableFormulaBuilderStep>step;

                if (p.getProofableFormulaBuilder() instanceof HypothesisAxiom) {
                    var h = (<FormulaSubstitution>p.getArguments()[0]).getElementToInsert();

                    if (hypothesis.equals(h)) {
                        return new ProofableFormulaBuilderStep(this.tImpSym,
                            Substitution.fromValues(this.tImpSym.getParameters(), [h, h]), context);
                    }
                }

                var s1 = new ProofableFormulaBuilderStep(this.ax1,
                    Substitution.fromValues(this.ax1.getParameters(), [p.getDeductedFormula(), hypothesis]), context);

                var s2 = new RuleStep(this.ruleMp, [p, s1], [], context);

                hashMap.set(step, s2);
                return s2;
            } else if (step instanceof RuleStep) {
                var r = <RuleStep>step;

                if (r.getRule() === this.ruleMp) {

                    var premise = r.getAssumptions()[0];
                    var implication = r.getAssumptions()[1];
                    var newPremise = this.removeHypothesis(premise, hypothesis, context, hashMap);
                    var newImplication = this.removeHypothesis(implication, hypothesis, context, hashMap);

                    var impl = <Syntax.Implication>implication.getDeductedFormula();

                    var s1 = new ProofableFormulaBuilderStep(this.ax2,
                        Syntax.Substitution.fromValues(this.ax2.getParameters(),
                        [hypothesis, premise.getDeductedFormula(), impl.getArguments()[1]]), context);
                    var s2 = new RuleStep(this.ruleMp, [newImplication, s1], [], context);
                    var s3 = new RuleStep(this.ruleMp, [newPremise, s2], [], context);

                    hashMap.set(step, s3);
                    return s3;
                } else if (r.getRule() instanceof DeductionRule) {

                    var assumption = r.getAssumptions()[0];
                    var subHypothesis = (<FormulaSubstitution>r.getArguments()[1]).getElementToInsert();

                    var s4 = this.removeHypothesis(assumption, subHypothesis, context, new HashMap<Step, Step>());
                    var result = this.removeHypothesis(s4, hypothesis, context, hashMap);
                    hashMap.set(step, result);
                    return result;
                }

                throw "Rule " + r.getRule().getName() + " is not supported.";
            }

            return step;
        }



        public removeAllHypotheses(step: Step, context: Syntax.ConditionContext): Step {

            if (step instanceof ProofableFormulaBuilderStep) {
                return step;
            } else if (step instanceof RuleStep) {
                var r = <RuleStep>step;

                if (r.getRule() instanceof DeductionRule) {

                    var assumption = r.getAssumptions()[0];
                    var hypothesis = (<FormulaSubstitution>r.getArguments()[1]).getElementToInsert();
                    var newStep = this.removeHypothesis(assumption, hypothesis, context, new HashMap<Step, Step>());

                    return newStep;
                }

                return null; //todo
            }

            return step;
        }
    }
}