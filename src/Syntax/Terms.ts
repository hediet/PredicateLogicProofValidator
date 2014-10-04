module FirstOrderPredicateLogic.Syntax {

    export class VariableWithTermSubstitution {

        private variableToSubstitute: VariableDeclaration;
        private termToInsert: Term;

        constructor(variableToSubstitute: VariableDeclaration, termToInsert: Term) {
            Helper.ArgumentExceptionHelper.ensureTypeOf(variableToSubstitute, VariableDeclaration, "variableToSubstitute");
            Helper.ArgumentExceptionHelper.ensureTypeOf(termToInsert, Term, "termToInsert");

            this.variableToSubstitute = variableToSubstitute;
            this.termToInsert = termToInsert;
        }

        public getVariableToSubstitute(): VariableDeclaration {
            return this.variableToSubstitute;
        }

        public getTermToInsert(): Term {
            return this.termToInsert;
        }
    }

    export class Declaration {
        private name: string;

        constructor(name: string) {
            this.name = name;
        }

        public getName(): string {
            return this.name;
        }
    }

    export class FunctionDeclaration extends Declaration {
        private arity: number;

        constructor(name: string, arity: number) {
            super(name);
            this.arity = arity;
        }

        public getArity(): number {
            return this.arity;
        }

        public toString() {
            return "Function declaration of " + this.getName();
        }
    }


    export class Term {
        public getContainingVariables(): VariableDeclaration[] {
            throw "This method is abstract";
        }

        public containsVariable(variable: VariableDeclaration): boolean {
            throw "This method is abstract";
        }

        public substitute(substitutions: VariableWithTermSubstitution[]): Term {
            throw "This method is abstract";
        }
    }

    export class VariableDeclaration extends Declaration {
        public toString() {
            return "Variable declaration of " + this.getName();
        }
    }

    export class VariableRef extends Term {

        private variableDeclaration: VariableDeclaration;

        constructor(variableDeclaration: VariableDeclaration) {
            super();
            this.variableDeclaration = variableDeclaration;
        }

        public getName(): string {
            return name;
        }

        public getContainingVariables(): VariableDeclaration[] {
            return [this.variableDeclaration];
        }

        public containsVariable(variable: VariableDeclaration): boolean {
            return variable.getName() == this.variableDeclaration.getName();
        }

        public substitute(substitutions: VariableWithTermSubstitution[]): Term {

            var result: Term = this;

            substitutions.some(s => {

                if (s.getVariableToSubstitute().getName() == this.variableDeclaration.getName()) {
                    result = s.getTermToInsert();
                    return true;
                }
                return false;
            });

            return result;
        }

        public toString() {
            return this.variableDeclaration.getName();
        }
    }


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