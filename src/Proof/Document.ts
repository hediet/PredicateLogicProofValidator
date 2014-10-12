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

    export class IdentifierElement {
        constructor(private identifier: string) {
            Common.ArgumentExceptionHelper.ensureTypeOf(identifier, "string", "name");
        }

        public getIdentifier() {
            return this.identifier;
        }
    }


    export class Description {

        private name: IdentifierElement;

        constructor(name: IdentifierElement) {
            this.name = name;
        }

        public getName(): IdentifierElement {
            return this.name;
        }

        public getFormulaBuilder(logger: Logger): ProofableFormulaBuilder {
            throw "abstract";
        }

        public getConditions(): AppliedCondition[] {
            throw "abstract";
        }
    }

    export class AbstractAxiomDescription extends Description {
        constructor(name: IdentifierElement) {
            super(name);
        }
    }


    export class CustomAxiomDescription extends AbstractAxiomDescription {
        private formulaBuilder: ProofableFormulaBuilder;

        constructor(formulaBuilder: ProofableFormulaBuilder) {
            super(new IdentifierElement(formulaBuilder.getName()));
            this.formulaBuilder = formulaBuilder;
        }

        public getFormulaBuilder(l: Logger): ProofableFormulaBuilder {
            return this.formulaBuilder;
        }
    }

    export class AxiomDescription extends AbstractAxiomDescription  {

        private symbols: Syntax.Declaration[];
        private assertion: Syntax.Formula;
        private conditions: AppliedCondition[];

        constructor(name: IdentifierElement, symbols: Syntax.Declaration[], assertion: Syntax.Formula, conditions: AppliedCondition[]) {
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

        public getFormulaBuilder(l: Logger): ProofableFormulaBuilder {

            if (this.getName() === null) {
                l.logError("Axiom must have a name", this);
                return null;
            }

            if (this.getAssertion() === null) {
                l.logError("Axiom must define an assertion", this);
                return null;
            }

            return new Axiom(this.getName().getIdentifier(), this.getSymbols(), this.getAssertion(), this.getConditions());
        }
    }

    export class AbstractRuleDescription extends Description {
        constructor(name: IdentifierElement) {
            super(name);
        }

        public getFormulaBuilder(l: Logger): Rule {
            throw "abstract";
        }
    }

    export class CustomRuleDescription extends AbstractRuleDescription {
        private formulaBuilder: Rule;

        constructor(formulaBuilder: Rule) {
            super(new IdentifierElement(formulaBuilder.getName()));
            this.formulaBuilder = formulaBuilder;
        }

        public getFormulaBuilder(l: Logger): Rule {
            return this.formulaBuilder;
        }
    }

    export class RuleDescription extends AbstractRuleDescription {

        private symbols: Syntax.Declaration[];
        private assumptions: Syntax.Formula[];
        private conclusion: Syntax.Formula;
        private conditions: AppliedCondition[];

        constructor(name: IdentifierElement, symbols: Syntax.Declaration[],
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

        public getFormulaBuilder(l: Logger): Rule {

            if (this.getName() === null) {
                l.logError("Rule must have a name", this);
                return null;
            }

            if (this.getConclusion() === null) {
                l.logError("Rule must have a conclusion", this);
                return null;
            }

            return new Rule(this.getName().getIdentifier(), this.getSymbols(), this.getConclusion(), this.getAssumptions(), this.getConditions());
        }
    }

    export class TheoremDescription extends Description {

        private symbols: Syntax.Declaration[];
        private proofSteps: ProofStep[];
        private assertion: Syntax.Formula;
        private conditions: Proof.AppliedCondition[];

        constructor(name: IdentifierElement, symbols: Syntax.Declaration[],
            assertion: Syntax.Formula, proofSteps: ProofStep[], conditions: Proof.AppliedCondition[]) {
            super(name);
            this.symbols = symbols;
            this.assertion = assertion;
            this.proofSteps = proofSteps;
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

        public getProofSteps(): ProofStep[] {
            return this.proofSteps;
        }

        public getFormulaBuilder(l: Logger): ProofableFormulaBuilder {

            if (this.getName() === null) {
                l.logError("Theorem has no name", this);
                return null;
            }

            if (this.getAssertion() === null) {
                l.logError("Theorem defines no assertion", this);
                return null;
            }

            return new Axiom(this.getName().getIdentifier(), this.getSymbols(), this.getAssertion(), this.conditions);
        }
    }


    export class StepRef {
        private referencedStep: IdentifierElement;

        constructor(referencedStep: IdentifierElement) {
            this.referencedStep = referencedStep;
        }

        public getReferencedStep(): IdentifierElement {
            return this.referencedStep;
        }
    }

    export class ProofStep {

        private stepIdentifier: IdentifierElement;
        private operation: IdentifierElement;
        private arguments: any[];

        constructor(stepIdentifier: IdentifierElement, operation: IdentifierElement, args: any[]) {
            this.stepIdentifier = stepIdentifier;
            this.operation = operation;
            this.arguments = args;
        }

        public getStepIdentifier(): IdentifierElement {
            return this.stepIdentifier;
        }

        public getOperation(): IdentifierElement {
            return this.operation;
        }

        public getArguments(): any[] {
            return this.arguments;
        }
    }

}