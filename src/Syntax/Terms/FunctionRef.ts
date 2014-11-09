module FirstOrderPredicateLogic.Syntax {

    export class FunctionRef extends Term {

        private functionDeclaration: FunctionDeclaration;
        private args: Term[];

        constructor(functionDeclaration: FunctionDeclaration, args: Term[]) {
            super();

            Common.ArgumentExceptionHelper.ensureTypeOf(functionDeclaration, FunctionDeclaration, "functionDeclaration");
            Common.ArgumentExceptionHelper.ensureArrayTypeOf(args, Term, "args");

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

        public getVariables(context: ConditionContext): VariableDeclaration[] {
            return Common.uniqueJoin(this.args, arg => arg.getVariables(context), r => r.getName());
        }

        public getDeclarations(): Declaration[]{
            var result = Common.uniqueJoin(this.args, arg => arg.getDeclarations(), r => r.getName());
            result.push(this.functionDeclaration);
            return Common.unique(result, r => r.getName());
        }

        public containsVariable(variable: VariableDeclaration, context: ConditionContext): boolean {
            return this.args.some(arg => arg.containsVariable(variable, context));
        }

        public substituteVariables(substitutions: VariableWithTermSubstitution[], context: ConditionContext): Term {
            var newArgs = this.args.map(a => a.substituteVariables(substitutions, context));
            return new FunctionRef(this.functionDeclaration, newArgs);
        }

        public substitute(substitutions: Substitution[]): Term {
            var newFunctionRef = this.functionDeclaration.substitute(substitutions);
            var newArgs = this.args.map(a => a.substitute(substitutions));
            return new FunctionRef(newFunctionRef, newArgs);
        }

        public resubstitute(concreteFormula: Term, collector: ISubstitutionCollector) {

            if (!(concreteFormula instanceof FunctionRef)) {
                collector.addIncompatibleNodes(this, concreteFormula);
                return;
            }
            
            var conreteFunctionRef = <FunctionRef>concreteFormula;

            if (this.getFunctionDeclaration().getArity() !== conreteFunctionRef.getFunctionDeclaration().getArity())
                collector.addIncompatibleNodes(this, concreteFormula);

            collector.addSubstitution(this.getFunctionDeclaration().createSubstitution(conreteFunctionRef.getFunctionDeclaration()));

            var args = conreteFunctionRef.getArguments();
            this.args.forEach((arg, idx) => arg.resubstitute(args[idx], collector));
        }

        public processAppliedSubstitutions(context: ConditionContext): Term {
            return new FunctionRef(this.functionDeclaration, this.args.map(arg => arg.processAppliedSubstitutions(context)));
        }

        public toString(): string {
            var name = this.functionDeclaration.getName();

            if (this.args.length === 2) {
                if (name === "add")
                    return this.args[0].toString() + " + " + this.args[1].toString();
                if (name === "mul")
                    return "(" + this.args[0].toString() + " * " + this.args[1].toString() + ")";
            }
            else if (this.args.length === 0) {
                if (name === "z")
                    return "0";
            }

            var argsStr = this.args.map(arg => arg.toString()).join(", ");

            return name + "(" + argsStr + ")";
        }
    }
}