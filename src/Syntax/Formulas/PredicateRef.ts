
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
            var newArgs = this.args.map(a => a.substitute(substitutions));
            return new PredicateRef(this.f, newArgs);
        }

        public substitute(substitutions: Substition[]): Formula {

            var subs = substitutions.filter(s => s instanceof VariableSubstition).map(s =>
                new VariableWithTermSubstitution((<VariableSubstition>s).getDeclarationToSubstitute(),
                    new VariableRef((<VariableSubstition>s).getVariableToInsert())));

            var newArgs = this.args.map(a => a.substitute(subs));
            return new PredicateRef(this.f, newArgs);
        }

        public resubstitute(instance: Formula): Substition[] {

            throw "Currently not implemented";

            if (!(instance instanceof PredicateRef))
                return null;

            this.args.forEach(arg => {



            });

        }

        public applySubstitutions(): Formula {
            return this;
        }

        public getUnboundVariables(): VariableDeclaration[] {
            //all variables are unbound
            return this.getVariables();
        }

        public getVariables(): VariableDeclaration[] {
            var result: VariableDeclaration[] = [];

            this.args.forEach(arg => {
                result = result.concat(arg.getContainingVariables());
            });

            result = Helper.unique(result, r => r.getName());

            return result;
        }

        public getFormulaRefs(): FormulaDeclaration[] {
            return [];
        }

        public toString(args: IFormulaToStringArgs = defaultFormulaToStringArgs): string {
            var argsStr = this.args.map(arg => arg.toString()).join(", ");

            if (argsStr == "")
                return this.f.getName();

            return this.f.getName() + "(" + argsStr + ")";
        }
    }
}