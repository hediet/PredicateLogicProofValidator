
module FirstOrderPredicateLogic.Syntax {

    export class Operation extends Formula {

        private operationFactory: IOperationFactory;
        private args: Formula[];

        constructor(operationFactory: IOperationFactory, args: Formula[]) {
            super();

            Helper.ArgumentExceptionHelper.ensureArrayTypeOf(args, Formula, "args");

            if (args.length !== operationFactory.getArity())
                throw "Invalid number of arguments!";

            this.operationFactory = operationFactory;
            this.args = args;
        }

        public getOperationFactory(): IOperationFactory {
            return this.operationFactory;
        }

        public getArguments(): Formula[] {
            return this.args;
        }

        public isSubstitutionCollisionFree(substitution: VariableWithTermSubstitution): boolean {
            return this.args.every(f => f.isSubstitutionCollisionFree(substitution));
        }

        public substituteUnboundVariables(substitutions: VariableWithTermSubstitution[]): Formula {
            return this.operationFactory.createInstance(this.args.map(arg => arg.substituteUnboundVariables(substitutions)));
        }

        public substitute(substitutions: Substitution[]): Formula {
            return this.operationFactory.createInstance(this.args.map(arg => arg.substitute(substitutions)));
        }

        public resubstitute(concreteFormula: Formula, collector: ISubstitutionCollector) {
            if (!(concreteFormula instanceof Operation)) {
                collector.addIncompatibleNodes(this, concreteFormula);
                return;
            }
            var concreteOperation = <Operation>concreteFormula;
            if (this.getOperationFactory() !== concreteOperation.getOperationFactory()) {
                collector.addIncompatibleNodes(this, concreteFormula);
                return;
            }

            var concreteOperationArgs = concreteOperation.getArguments();

            this.args.forEach((arg, idx) => arg.resubstitute(concreteOperationArgs[idx], collector));
        }


        public processAppliedSubstitutions(): Formula {
            return this.operationFactory.createInstance(this.args.map(arg => arg.processAppliedSubstitutions()));
        }

        public getUnboundVariables(): VariableDeclaration[] {
            return Helper.uniqueJoin(this.args, arg => arg.getUnboundVariables(), r => r.getName());
        }

        public containsUnboundVariable(variable: VariableDeclaration): boolean {
            return this.args.some(arg => arg.containsUnboundVariable(variable));
        }

        public containsBoundVariable(variable: VariableDeclaration): boolean {
            return this.args.some(arg => arg.containsBoundVariable(variable));
        }

        public getDeclarations(): Declaration[] {
            return Helper.uniqueJoin(this.args, arg => arg.getDeclarations(), r => r.getName());
        }
    }
}