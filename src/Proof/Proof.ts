
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

    

    export class Step {
        public getDeductedFormula(): Syntax.Formula {
            throw "abstract";
        }
    }

    export class ProofableFormulaBuilderStep extends Step {

        private pfb: ProofableFormulaBuilder;
        private args: Syntax.Substitution[];

        constructor(pfb: ProofableFormulaBuilder, args: Syntax.Substitution[]) {
            super();
            this.pfb = pfb;
            this.args = args;

            pfb.getConditions().forEach(c => {
                if (!c.check(this.args))
                    throw "condition not met!";
            });
        }

        public getArguments(): Syntax.Substitution[] {
            return this.args;
        }

        public getProofableFormulaBuilder(): ProofableFormulaBuilder {
            return this.pfb;
        }

        public getDeductedFormula(): Syntax.Formula {

            return this.pfb.getFormulaTemplate().substitute(this.args).applySubstitutions();
        }

    }

    export class RuleStep extends Step {

        private rule: Rule;
        private args: Syntax.Substitution[];
        private assumptions: Step[];

        constructor(rule: Rule, assumptions: Step[], args: Syntax.Substitution[]) {
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
            } else {
                if (!substitution.equals(oldSubst))
                    this.error = true;
            }
        }

        public addIncompatibleNodes(genericFormula: Syntax.Formula, specialFormula: Syntax.Formula) {
            this.error = true;
        }
    }

}

