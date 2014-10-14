module FirstOrderPredicateLogic.Proof {


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

    class SubstitutionConflict {
        public toString(): string {
            throw "abstract";
        }
    }

    class IncompatibleNodeConflict {
        constructor(private genericFormula: Syntax.Formula, private concreteFormula: Syntax.Formula) {
        }

        public toString(): string {
            return "Cannot insert '" + this.concreteFormula + "' into '" + this.genericFormula + "'";
        }
    }

    class SubstituteWithDifferentElements {
        
        constructor(private declaration: Syntax.Declaration,
            private elementsToInsert: Syntax.Node[]) {
        }

        public toString(): string {
            return "Cannot substitute '" + this.declaration + "' with " +
                this.elementsToInsert.map(e => "'" + e.toString() + "'").join(" and ") + " at the same time.";
        }
    }

    class SubstitutionCollector implements Syntax.ISubstitutionCollector {

        private substitutions: { [id: string]: Syntax.Substitution[] } = {};

        private conflicts: IncompatibleNodeConflict[] = [];
        private isError: boolean;

        public getIsError(): boolean {
            return this.isError;
        }

        public getConflicts(): SubstitutionConflict[] {
            var result: SubstitutionConflict[] = this.conflicts;

            for (var propt in this.substitutions) {
                if ((this.substitutions[propt].length > 1)) {
                    result.push(new SubstituteWithDifferentElements(
                        this.substitutions[propt][0].getDeclarationToSubstitute(),
                        this.substitutions[propt].map(s => s.getElementToInsert())));
                }
            }

            return result;
        }

        public getSubstitutions(): Syntax.Substitution[] {

            var result: Syntax.Substitution[] = [];

            for (var propt in this.substitutions) {
                result.push(this.substitutions[propt][0]);
            }

            return result;
        }

        public addSubstitution(substitution: Syntax.Substitution) {

            var name = substitution.getDeclarationToSubstitute().getName();
            var oldSubsts = this.substitutions[name];

            if (typeof oldSubsts === "undefined") {
                this.substitutions[name] = [substitution];
            } else if (!oldSubsts.some(s => substitution.equals(s))) {
                this.isError = true;
                oldSubsts.push(substitution);
            }
        }

        public addIncompatibleNodes(genericFormula: Syntax.Formula, concreteFormula: Syntax.Formula) {
            this.isError = true;
            this.conflicts.push(new IncompatibleNodeConflict(genericFormula, concreteFormula));
        }
    }

}

