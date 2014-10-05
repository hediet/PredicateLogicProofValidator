
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

        public getDeclarations(): Declaration[] {
            var result: Declaration[] = [];
            this.args.forEach(item => {
                result = result.concat(item.getDeclarations());
            });

            result = Helper.unique(result, r => r.getName());
            return result;
        }

        public containsVariable(variable: VariableDeclaration): boolean {
            var result = false;
            this.args.forEach(item => {
                if (item.containsVariable(variable))
                    result = true;
            });
            return result;
        }

        public substituteVariables(substitutions: VariableWithTermSubstitution[]): Term {
            var newArgs = this.args.map(a => a.substituteVariables(substitutions));
            return new FunctionRef(this.f, newArgs);
        }

        public substitute(substitutions: Substitution[]): Term {

            var newFunctionRef = this.f;
            substitutions.some(subst => {
                if (subst.getDeclarationToSubstitute().equals(this.f)) {
                    newFunctionRef = subst.getElementToInsert();
                    return true;
                }
                return false;
            });

            var newArgs = this.args.map(a => a.substitute(substitutions));
            return new FunctionRef(newFunctionRef, newArgs);
        }

        public resubstitute(specialFormula: Term, substService: ISubstitutionCollector) {

            if (!(specialFormula instanceof FunctionRef))
                substService.addIncompatibleNodes(this, specialFormula);
            
            var fr = <FunctionRef>specialFormula;

            if (this.getFunction().getArity() !== fr.getFunction().getArity())
                substService.addIncompatibleNodes(this, specialFormula);

            substService.addSubstitution(new FunctionSubstitution(this.getFunction(), fr.getFunction()));

            var args = fr.getArguments();
            this.args.forEach((arg, idx) => arg.resubstitute(args[idx], substService));
        }

        public toString() {
            var argsStr = this.args.map(arg => arg.toString()).join(", ");

            return this.f.getName() + "(" + argsStr + ")";
        }
    }
}