
module FirstOrderPredicateLogic.Syntax {


    export interface IOperationFactory {
        getPriority(): number;
        getArity(): number;
        getName(): string;
        createInstance(args: Formula[]): Operation;
    }


    export class Operation extends Formula {
        public getOperationFactory(): IOperationFactory {
            throw "not implemented";
        }
    }

    export class UnaryOperation extends Operation {

        private operationFactory: IOperationFactory;
        private arg: Formula;

        constructor(arg: Formula, operationFactory: IOperationFactory) {
            super();
            this.arg = arg;
            this.operationFactory = operationFactory;
        }

        public getArg(): Formula {
            return this.arg;
        }


        public getOperationFactory(): IOperationFactory {
            return this.operationFactory;
        }


        public isSubstitutionCollisionFree(substitution: VariableWithTermSubstitution): boolean {
            return this.arg.isSubstitutionCollisionFree(substitution);
        }

        public substituteUnboundVariables(substitutions: VariableWithTermSubstitution[]): Formula {
            return this.operationFactory.createInstance([this.arg.substituteUnboundVariables(substitutions)]);
        }

        public substitute(substitutions: Substition[]): Formula {
            return this.getOperationFactory().createInstance([this.arg.substitute(substitutions)]);
        }

        public resubstitute(instance: Formula, substService: IResubstitutionService) {
            if (!(instance instanceof UnaryOperation)) {
                substService.addIncompatibleNodes(this, instance);
                return;
            }
            var a = <UnaryOperation>instance;
            if (this.getOperationFactory() !== a.getOperationFactory()) {
                substService.addIncompatibleNodes(this, instance);
                return;
            }

            this.arg.resubstitute(a.getArg(), substService);
        }

        public applySubstitutions(): Formula {
            return this.getOperationFactory().createInstance([this.arg.applySubstitutions()]);
        }

        public getUnboundVariables(): VariableDeclaration[] {
            return this.arg.getUnboundVariables();
        }

        public getVariables(): VariableDeclaration[] {
            return this.arg.getVariables();
        }

        public getFormulaRefs(): FormulaDeclaration[] {
            return this.arg.getFormulaRefs();
        }

        public toString(args: IFormulaToStringArgs = defaultFormulaToStringArgs): string {

            var subArgs = {
                forceParenthesis: args.forceParenthesis,
                parentOperatorPriority: this.getOperationFactory().getPriority()
            };

            var result = this.getOperationFactory().getName() + this.arg.toString(subArgs);

            if (args.parentOperatorPriority > subArgs.parentOperatorPriority || args.forceParenthesis)
                result = "(" + result + ")";

            return result;
        }
    }

    export class BinaryOperation extends Operation {

        private operationFactory: IOperationFactory;
        private leftArg: Formula;
        private rightArg: Formula;

        constructor(leftArg: Formula, rightArg: Formula, operationFactory: IOperationFactory) {
            super();
            this.leftArg = leftArg;
            this.rightArg = rightArg;
            this.operationFactory = operationFactory;
        }

        public getLeftArg(): Formula {
            return this.leftArg;
        }

        public getRightArg(): Formula {
            return this.rightArg;
        }

        public getOperationFactory(): IOperationFactory {
            return this.operationFactory;
        }

        public isSubstitutionCollisionFree(substitution: VariableWithTermSubstitution): boolean {
            return this.leftArg.isSubstitutionCollisionFree(substitution) &&
                this.rightArg.isSubstitutionCollisionFree(substitution);
        }

        public substituteUnboundVariables(substitutions: VariableWithTermSubstitution[]): Formula {
            return this.operationFactory.createInstance(
                [this.leftArg.substituteUnboundVariables(substitutions),
                    this.rightArg.substituteUnboundVariables(substitutions)]);
        }

        public substitute(substitutions: Substition[]): Formula {
            return this.operationFactory.createInstance(
                [this.leftArg.substitute(substitutions),
                    this.rightArg.substitute(substitutions)]);
        }

        public resubstitute(instance: Formula, substService: IResubstitutionService) {
            if (!(instance instanceof BinaryOperation)) {
                substService.addIncompatibleNodes(this, instance);
                return;
            }
            var a = <BinaryOperation>instance;
            if (this.getOperationFactory() !== a.getOperationFactory()) {
                substService.addIncompatibleNodes(this, instance);
                return;
            }

            this.leftArg.resubstitute(a.getLeftArg(), substService);
            this.rightArg.resubstitute(a.getRightArg(), substService);
        }


        public applySubstitutions(): Formula {
            return this.operationFactory.createInstance(
                [this.leftArg.applySubstitutions(), this.rightArg.applySubstitutions()]);
        }

        public getUnboundVariables(): VariableDeclaration[] {
            var result = this.leftArg.getUnboundVariables();
            result = result.concat(this.rightArg.getUnboundVariables());
            result = Helper.unique(result, r => r.getName());

            return result;
        }

        public getVariables(): VariableDeclaration[] {
            var result = this.leftArg.getVariables();
            result = result.concat(this.rightArg.getVariables());
            result = Helper.unique(result, r => r.getName());

            return result;
        }

        public getFormulaRefs(): FormulaDeclaration[] {
            var result = this.leftArg.getFormulaRefs();
            result = result.concat(this.rightArg.getFormulaRefs());
            result = Helper.unique(result, r => r.getName());

            return result;
        }

        public toString(args: IFormulaToStringArgs = defaultFormulaToStringArgs): string {

            var subArgs1 = {
                forceParenthesis: args.forceParenthesis,
                parentOperatorPriority: this.getOperationFactory().getPriority()
            };

            var subArgs2 = {
                forceParenthesis: args.forceParenthesis,
                parentOperatorPriority: this.getOperationFactory().getPriority() + 1
            };

            var result = this.leftArg.toString(subArgs1) + " " + this.getOperationFactory().getName() + " " + this.rightArg.toString(subArgs2);

            if (args.parentOperatorPriority > subArgs1.parentOperatorPriority || args.forceParenthesis)
                result = "(" + result + ")";

            return result;
        }
    }


    export class OperationFactory implements IOperationFactory {

        private createInstanceFunc: (args: Formula[], of: OperationFactory) => Operation;
        private name: string;
        private priority: number;
        private arity: number;

        constructor(name: string, arity: number, priority: number,
            createInstanceFunc: (args: Formula[], of: OperationFactory) => Operation) {
            this.name = name;
            this.arity = arity;
            this.priority = priority;
            this.createInstanceFunc = createInstanceFunc;
        }

        public getName() {
            return this.name;
        }

        public createInstance(args: Formula[]): Operation {
            return this.createInstanceFunc(args, this);
        }

        public getPriority(): number {
            return this.priority;
        }

        public getArity(): number {
            return this.arity;
        }
    }


    export class Equivalence extends BinaryOperation {
        static factory = new OperationFactory("<->", 2, 100, (args, of) => new Implication(args[0], args[1], of));
    }

    export class Implication extends BinaryOperation {
        static factory = new OperationFactory("->", 2, 100, (args, of) => new Implication(args[0], args[1], of));
    }

    export class Or extends BinaryOperation {
        static factory = new OperationFactory("|", 2, 300, (args, of) => new Implication(args[0], args[1], of));
    }

    export class And extends BinaryOperation {
        static factory = new OperationFactory("&", 2, 400, (args, of) => new Implication(args[0], args[1], of));
    }

    export class Negation extends UnaryOperation {
        static factory = new OperationFactory("!", 1, 500, (args, of) => new Negation(args[0], of));
    }
}