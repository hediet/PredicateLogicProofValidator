
module FirstOrderPredicateLogic.Syntax {

    export class PredicateRef extends Formula {

        private predicateDeclaration: PredicateDeclaration;
        private args: Term[];

        constructor(predicateDeclaration: PredicateDeclaration, args: Term[]) {
            super();

            Common.ArgumentExceptionHelper.ensureTypeOf(predicateDeclaration, PredicateDeclaration, "predicateDeclaration");
            Common.ArgumentExceptionHelper.ensureArrayTypeOf(args, Term, "args");

            if (args.length !== predicateDeclaration.getArity())
                throw "Invalid number of arguments!";

            this.predicateDeclaration = predicateDeclaration;
            this.args = args;
        }

        public getPredicate(): PredicateDeclaration {
            return this.predicateDeclaration;
        }

        public getArguments(): Term[] {
            return this.args;
        }

        public isSubstitutionCollisionFree(substitution: VariableWithTermSubstitution): boolean {
            return true;
        }

        public substituteUnboundVariables(substitutions: VariableWithTermSubstitution[], context: ConditionContext): Formula {
            var newArgs = this.args.map(a => a.substituteVariables(substitutions, context));
            return new PredicateRef(this.predicateDeclaration, newArgs);
        }

        public substitute(substitutions: Substitution[]): Formula {

            var newPredicateDeclaration = this.predicateDeclaration.substitute(substitutions);
            var newArgs = this.args.map(a => a.substitute(substitutions));
            return new PredicateRef(newPredicateDeclaration, newArgs);
        }

        public resubstitute(concreteFormula: Formula, collector: ISubstitutionCollector): void {

            if (!(concreteFormula instanceof PredicateRef)) {
                collector.addIncompatibleNodes(this, concreteFormula);
                return;
            }

            var conretePredicateRef = <PredicateRef>concreteFormula;

            if (!this.getPredicate().equals(conretePredicateRef.getPredicate()))
                collector.addIncompatibleNodes(this, concreteFormula);

            this.args.forEach((arg, i) => {
                arg.resubstitute(conretePredicateRef.args[i], collector);
            });
        }

        public processAppliedSubstitutions(context: ConditionContext): Formula {
            return new PredicateRef(this.predicateDeclaration, this.args.map(arg => arg.processAppliedSubstitutions(context)));
        }

        public getUnboundVariables(context: ConditionContext): VariableDeclaration[] {
            return Common.uniqueJoin(this.args, arg => arg.getVariables(context), r => r.getName());
        }

        public containsUnboundVariable(variable: VariableDeclaration, context: ConditionContext): boolean {
            return this.args.some(a => a.containsVariable(variable, context));
        }

        public containsBoundVariable(variable: VariableDeclaration, context: ConditionContext): boolean {
            return this.containsUnboundVariable(variable, context);
        }


        public getDeclarations(): Declaration[] {
            var result = Common.uniqueJoin(this.args, arg => arg.getDeclarations(), r => r.getName());
            result.push(this.predicateDeclaration);
            return Common.unique(result, r => r.getName());
        }

        public toString(args: IFormulaToStringArgs = defaultFormulaToStringArgs): string {

            var name = this.predicateDeclaration.getName();

            if (this.args.length === 2) {
                if (name === "eq")
                    return this.args[0].toString() + " = " + this.args[1].toString();
            }
                
            var argsStr = this.args.map(arg => arg.toString()).join(", ");

            return this.predicateDeclaration.getName() + ((argsStr !== "") ? "(" + argsStr + ")" : "");
        }
    }
}