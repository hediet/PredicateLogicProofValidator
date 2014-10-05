
module FirstOrderPredicateLogic.Syntax {


    export class FunctionRef extends Term {

        private f: FunctionDeclaration;
        private args: Term[];

        constructor(f: FunctionDeclaration, args: Term[]) {
            super();
            this.f = f;
            this.args = args;
        }

        public getFunction(): FunctionDeclaration {
            return this.f;
        }

        public getArguments(): Term[] {
            return this.args;
        }

        public getContainingVariables(): VariableDeclaration[] {
            var result: VariableDeclaration[] = [];
            this.args.forEach(item => {
                result = result.concat(item.getContainingVariables());
            });

            result = Helper.unique(result, r => r.getName());
            return result;
        }

        public containsVariable(variable: VariableDeclaration): boolean {
            var result: boolean = false;
            this.args.forEach(item => {
                if (item.containsVariable(variable))
                    result = true;
            });
            return result;
        }

        public substitute(substitutions: VariableWithTermSubstitution[]): Term {
            var newArgs = this.args.map(a => a.substitute(substitutions));
            return new FunctionRef(this.f, newArgs);
        }

        public toString() {
            var argsStr = this.args.map(arg => arg.toString()).join(", ");

            return this.f.getName() + "(" + argsStr + ")";
        }
    }
}