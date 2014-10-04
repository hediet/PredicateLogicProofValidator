
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
    }

    export class AxiomDescription extends Description {


        private symbols: Syntax.Declaration[];
        private assertion: Syntax.Formula;

        constructor(name: string, symbols: Syntax.Declaration[], assertion: Syntax.Formula) {
            super(name);
            this.symbols = symbols;
            this.assertion = assertion;
        }

        public getSymbols(): Syntax.Declaration[] {
            return this.symbols;
        }

        public getAssertion() {
            return this.assertion;
        }
    }


    export class RuleDescription extends Description {

        private symbols: Syntax.Declaration[];
        private assumptions: Syntax.Formula[];
        private conclusion: Syntax.Formula;

        constructor(name: string, symbols: Syntax.Declaration[], assumptions: Syntax.Formula[], conclusion: Syntax.Formula) {
            super(name);
            this.symbols = symbols;
            this.assumptions = assumptions;
            this.conclusion = conclusion;
        }

        public getSymbols(): Syntax.Declaration[] {
            return this.symbols;
        }

        public getAssumptions() {
            return this.assumptions;
        }

        public getConclusion() {
            return this.conclusion;
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