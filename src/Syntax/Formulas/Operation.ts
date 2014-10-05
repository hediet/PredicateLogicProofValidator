
module FirstOrderPredicateLogic.Syntax {

    export class Operation extends Formula {

        private operationFactory: IOperationFactory;
        private args: Formula[];

        constructor(operationFactory: IOperationFactory, args: Formula[]) {

            super();

            this.operationFactory = operationFactory;
            this.args = args;
        }

        public getOperationFactory(): IOperationFactory {
            return this.operationFactory;
        }

        public getArgs(): Formula[] {
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

        public resubstitute(instance: Formula, substService: ISubstitutionCollector) {
            if (!(instance instanceof Operation)) {
                substService.addIncompatibleNodes(this, instance);
                return;
            }
            var a = <Operation>instance;
            if (this.getOperationFactory() !== a.getOperationFactory()) {
                substService.addIncompatibleNodes(this, instance);
                return;
            }

            var operationArgs = a.getArgs();

            this.args.forEach((arg, idx) => arg.resubstitute(operationArgs[idx], substService));
        }


        public applySubstitutions(): Formula {
            return this.operationFactory.createInstance(this.args.map(arg => arg.applySubstitutions()));
        }

        public getUnboundVariables(): VariableDeclaration[] {

            var result: VariableDeclaration[] = [];
            this.args.forEach(arg => result = Helper.unique(result.concat(arg.getUnboundVariables()), r => r.getName()));

            return result;
        }

        public getDeclarations(): Declaration[] {

            var result: Declaration[] = [];
            this.args.forEach(arg => result = Helper.unique(result.concat(arg.getDeclarations()), r => r.getName()));

            return result;
        }
    }
}