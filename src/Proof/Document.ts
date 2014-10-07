module FirstOrderPredicateLogic.Proof {


    export class Document {

        private descriptions: Description[];

        constructor(descriptions: Description[]) {
            this.descriptions = descriptions;
        }

        public getDescriptions(): Description[] {
            return this.descriptions;
        }
    }

    export class Description {

        private name: string;

        constructor(name: string) {
            this.name = name;
        }

        public getName(): string {
            return this.name;
        }

        public getFormulaBuilder(): ProofableFormulaBuilder {
            throw "abstract";
        }
    }

    export class AbstractAxiomDescription extends Description {
        constructor(name: string) {
            super(name);
        }

        public getFormulaBuilder(): ProofableFormulaBuilder {
            throw "abstract";
        }
    }


    export class CustomAxiomDescription extends AbstractAxiomDescription {
        private formulaBuilder: ProofableFormulaBuilder;

        constructor(formulaBuilder: ProofableFormulaBuilder) {
            super(formulaBuilder.getName());
            this.formulaBuilder = formulaBuilder;
        }

        public getFormulaBuilder(): ProofableFormulaBuilder {
            return this.formulaBuilder;
        }
    }

    export class AxiomDescription extends AbstractAxiomDescription  {

        private symbols: Syntax.Declaration[];
        private assertion: Syntax.Formula;
        private conditions: AppliedCondition[];

        constructor(name: string, symbols: Syntax.Declaration[], assertion: Syntax.Formula, conditions: AppliedCondition[]) {
            super(name);
            this.symbols = symbols;
            this.assertion = assertion;
            this.conditions = conditions;
        }

        public getConditions(): AppliedCondition[] {
            return this.conditions;
        }

        public getSymbols(): Syntax.Declaration[] {
            return this.symbols;
        }

        public getAssertion() {
            return this.assertion;
        }

        public getFormulaBuilder(): ProofableFormulaBuilder {
            return new Axiom(this.getName(), this.getSymbols(), this.getAssertion(), this.getConditions());
        }
    }

    export class AbstractRuleDescription extends Description {
        constructor(name: string) {
            super(name);
        }

        public getFormulaBuilder(): Rule {
            throw "abstract";
        }
    }

    export class CustomRuleDescription extends AbstractRuleDescription {
        private formulaBuilder: Rule;

        constructor(formulaBuilder: Rule) {
            super(formulaBuilder.getName());
            this.formulaBuilder = formulaBuilder;
        }

        public getFormulaBuilder(): Rule {
            return this.formulaBuilder;
        }
    }

    export class RuleDescription extends AbstractRuleDescription {

        private symbols: Syntax.Declaration[];
        private assumptions: Syntax.Formula[];
        private conclusion: Syntax.Formula;
        private conditions: AppliedCondition[];

        constructor(name: string, symbols: Syntax.Declaration[],
            assumptions: Syntax.Formula[], conclusion: Syntax.Formula, conditions: AppliedCondition[]) {
            super(name);
            this.symbols = symbols;
            this.assumptions = assumptions;
            this.conclusion = conclusion;
            this.conditions = conditions;
        }

        public getSymbols(): Syntax.Declaration[] {
            return this.symbols;
        }

        public getConditions(): AppliedCondition[] {
            return this.conditions;
        }

        public getAssumptions() {
            return this.assumptions;
        }

        public getConclusion() {
            return this.conclusion;
        }

        public getFormulaBuilder(): Rule {
            return new Rule(this.getName(), this.getSymbols(), this.getConclusion(), this.getAssumptions(), this.getConditions());
        }
    }

    export class TheoremDescription extends Description {

        private symbols: Syntax.Declaration[];
        private proofSteps: ProofStep[];
        private assertion: Syntax.Formula;

        constructor(name: string, symbols: Syntax.Declaration[],
            assertion: Syntax.Formula, proofSteps: ProofStep[]) {
            super(name);
            this.symbols = symbols;
            this.assertion = assertion;
            this.proofSteps = proofSteps;
        }

        public getSymbols(): Syntax.Declaration[] {
            return this.symbols;
        }

        public getAssertion() {
            return this.assertion;
        }

        public getProofSteps(): ProofStep[] {
            return this.proofSteps;
        }

        public getFormulaBuilder(): ProofableFormulaBuilder {
            return new Axiom(this.getName(), this.getSymbols(), this.getAssertion(), []);
        }
    }


    export class StepRef {
        private referencedStep: string;

        constructor(referencedStep: string) {
            this.referencedStep = referencedStep;
        }

        public getReferencedStep(): string {
            return this.referencedStep;
        }
    }

    export class ProofStep {

        private stepIdentifier: string;
        private operation: string;
        private arguments: any[];

        constructor(stepIdentifier: string, operation: string, args: any[]) {
            this.stepIdentifier = stepIdentifier;
            this.operation = operation;
            this.arguments = args;
        }

        public getStepIdentifier(): string {
            return this.stepIdentifier;
        }

        public getOperation(): string {
            return this.operation;
        }

        public getArguments(): any[] {
            return this.arguments;
        }
    }

}