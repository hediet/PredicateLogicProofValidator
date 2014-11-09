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
}