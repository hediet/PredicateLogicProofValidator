module FirstOrderPredicateLogic.Syntax {

    export class FunctionRef extends Term {

        private functionDeclaration: FunctionDeclaration;
        private args: Term[];

        constructor(functionDeclaration: FunctionDeclaration, args: Term[]) {
            super();

            Helper.ArgumentExceptionHelper.ensureTypeOf(functionDeclaration, FunctionDeclaration, "functionDeclaration");
            Helper.ArgumentExceptionHelper.ensureArrayTypeOf(args, Term, "args");

            if (args.length !== functionDeclaration.getArity())
                throw "Invalid number of arguments!";

            this.functionDeclaration = functionDeclaration;
            this.args = args;
        }

        public getFunctionDeclaration(): FunctionDeclaration {
            return this.functionDeclaration;
        }

        public getArguments(): Term[] {
            return this.args;
        }

        public getDeclarations(): Declaration[]{
            return Helper.uniqueJoin(this.args, arg => arg.getDeclarations(), r => r.getName());
        }

        public containsVariable(variable: VariableDeclaration): boolean {
            return this.args.some(arg => arg.containsVariable(variable));
        }

        public substituteVariables(substitutions: VariableWithTermSubstitution[]): Term {
            var newArgs = this.args.map(a => a.substituteVariables(substitutions));
            return new FunctionRef(this.functionDeclaration, newArgs);
        }

        public substitute(substitutions: Substitution[]): Term {
            var newFunctionRef = this.functionDeclaration.substitute(substitutions);
            var newArgs = this.args.map(a => a.substitute(substitutions));
            return new FunctionRef(newFunctionRef, newArgs);
        }

        public resubstitute(concreteFormula: Term, collector: ISubstitutionCollector) {

            if (!(concreteFormula instanceof FunctionRef))
                collector.addIncompatibleNodes(this, concreteFormula);
            
            var conreteFunctionRef = <FunctionRef>concreteFormula;

            if (this.getFunctionDeclaration().getArity() !== conreteFunctionRef.getFunctionDeclaration().getArity())
                collector.addIncompatibleNodes(this, concreteFormula);

            collector.addSubstitution(this.getFunctionDeclaration().createSubstitution(conreteFunctionRef.getFunctionDeclaration()));

            var args = conreteFunctionRef.getArguments();
            this.args.forEach((arg, idx) => arg.resubstitute(args[idx], collector));
        }

        public toString() {
            var argsStr = this.args.map(arg => arg.toString()).join(", ");

            return this.functionDeclaration.getName() + "(" + argsStr + ")";
        }
    }
}