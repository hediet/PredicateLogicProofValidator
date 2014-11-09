module FirstOrderPredicateLogic.Proof {
    import FormulaRef = Syntax.FormulaRef;
    import Formula = Syntax.Formula;
    import Substitution = Syntax.Substitution;

    export class HypothesisAxiom extends Axiom {

        constructor() {
            var phi = new Syntax.FormulaDeclaration("phi");

            super("Hypothesis", [phi], new Syntax.FormulaRef(phi), []);
        }

        public getHypotheses(assumptionHypotheses: Syntax.Formula[], args: Syntax.Substitution[], context: Syntax.ConditionContext): Syntax.Formula[] {

            var substitutedFormula = this.getFormulaTemplate().substitute(args);
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
                Syntax.Implication.factory.createInstance([this.phiFormula, new FormulaRef(psi)]),
                [new Syntax.FormulaRef(psi)], []);
        }

        public getHypotheses(assumptionHypotheses: Formula[], args: Substitution[]): Formula[] {

            var phi = this.phiFormula.substitute(args);
            var assumption = Common.firstOrDefault(assumptionHypotheses, null, h => h.equals(phi) ? h : null);

            if (assumption === null)
                throw "Invalid assumption!";

            return assumptionHypotheses.filter(a => a !== assumption);
        }
    }
}