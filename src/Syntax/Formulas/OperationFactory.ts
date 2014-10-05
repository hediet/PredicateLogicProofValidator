
module FirstOrderPredicateLogic.Syntax {

    export interface IOperationFactory {
        getPriority(): number;
        getArity(): number;
        getName(): string;
        getName(useUnicode: boolean): string;
        createInstance(args: Formula[]): Operation;
    }


    export class OperationFactory implements IOperationFactory {

        private createInstanceFunc: (args: Formula[], of: OperationFactory) => Operation;
        private name: string;
        private unicodeName: string;
        private priority: number;
        private arity: number;

        constructor(name: string, unicodename: string, arity: number, priority: number,
            createInstanceFunc: (args: Formula[], of: OperationFactory) => Operation) {
            this.name = name;
            this.unicodeName = unicodename;
            this.arity = arity;
            this.priority = priority;
            this.createInstanceFunc = createInstanceFunc;
        }

        public getName(useUnicode: boolean = false) {
            if (useUnicode)
                return this.unicodeName;
            else
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
}