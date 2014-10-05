
module FirstOrderPredicateLogic.Syntax {

    export class PredicateRef extends Formula {

        private f: PredicateDeclaration;
        private args: Term[];

        constructor(f: PredicateDeclaration, args: Term[]) {
            super();
            this.f = f;
            this.args = args;
        }

        public getPredicate(): PredicateDeclaration {
            return this.f;
        }

        public getArguments(): Term[] {
            return this.args;
        }


        public isSubstitutionCollisionFree(substitution: VariableWithTermSubstitution): boolean {
            return true;
        }

        public substituteUnboundVariables(substitutions: VariableWithTermSubstitution[]): Formula {
            var newArgs = this.args.map(a => a.substituteVariables(substitutions));
            return new PredicateRef(this.f, newArgs);
        }

        public substitute(substitutions: Substitution[]): Formula {

            //todo substitute predicate

            var newArgs = this.args.map(a => a.substitute(substitutions));
            return new PredicateRef(this.f, newArgs);
        }

        public resubstitute(specialFormula: Formula, substService: ISubstitutionCollector): void {

            if (!(specialFormula instanceof PredicateRef))
                substService.addIncompatibleNodes(this, specialFormula);

            var pr = <PredicateRef>specialFormula;

            if (!this.getPredicate().equals(pr.getPredicate()))
                substService.addIncompatibleNodes(this, specialFormula);

            this.args.forEach((arg, i) => {
                arg.resubstitute(pr.args[i], substService);
            });

            //todo check if arg
        }

        public applySubstitutions(): Formula {
            return this;
        }

        public getUnboundVariables(): VariableDeclaration[] {
            return this.getDeclarations().filter(d => d instanceof VariableDeclaration).map(d => <VariableDeclaration>d);
        }

        public getDeclarations(): Declaration[] {
            var result: Declaration[] = [];

            this.args.forEach(arg => {
                result = result.concat(arg.getDeclarations());
            });
            result = Helper.unique(result, r => r.getName());

            return result;
        }

        public toString(args: IFormulaToStringArgs = defaultFormulaToStringArgs): string {
            var argsStr = this.args.map(arg => arg.toString()).join(", ");

            if (argsStr == "")
                return this.f.getName();

            return this.f.getName() + "(" + argsStr + ")";
        }
    }
}