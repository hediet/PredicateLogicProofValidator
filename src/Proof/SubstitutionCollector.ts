module FirstOrderPredicateLogic.Proof {

    export class SubstitutionCollector implements Syntax.ISubstitutionCollector {

        private substitutions: { [id: string]: Syntax.Substitution[] } = {};

        private conflicts: IncompatibleNodeConflict[] = [];
        private isError: boolean;

        public getIsError(): boolean {
            return this.isError;
        }

        public getConflicts(): SubstitutionConflict[] {
            var result: SubstitutionConflict[] = this.conflicts;

            for (var propt in this.substitutions) {
                if ((this.substitutions[propt].length > 1)) {
                    result.push(new SubstituteWithDifferentElements(
                        this.substitutions[propt][0].getDeclarationToSubstitute(),
                        this.substitutions[propt].map(s => s.getElementToInsert())));
                }
            }

            return result;
        }

        public getSubstitutions(): Syntax.Substitution[] {

            var result: Syntax.Substitution[] = [];

            for (var propt in this.substitutions) {
                result.push(this.substitutions[propt][0]);
            }

            return result;
        }

        public addSubstitution(substitution: Syntax.Substitution) {

            var name = substitution.getDeclarationToSubstitute().getName();
            var oldSubsts = this.substitutions[name];

            if (typeof oldSubsts === "undefined") {
                this.substitutions[name] = [substitution];
            } else if (!oldSubsts.some(s => substitution.equals(s))) {
                this.isError = true;
                oldSubsts.push(substitution);
            }
        }

        public addIncompatibleNodes(genericFormula: Syntax.Formula, concreteFormula: Syntax.Formula) {
            this.isError = true;
            this.conflicts.push(new IncompatibleNodeConflict(genericFormula, concreteFormula));
        }
    }

    export class SubstitutionConflict {
        public toString(): string {
            throw "abstract";
        }
    }

    export class IncompatibleNodeConflict extends SubstitutionConflict {
        constructor(private genericFormula: Syntax.Formula, private concreteFormula: Syntax.Formula) {
            super();
        }

        public toString(): string {
            return "Cannot insert '" + this.concreteFormula + "' into '" + this.genericFormula + "'";
        }
    }

    export class SubstituteWithDifferentElements extends SubstitutionConflict {
        
        constructor(private declaration: Syntax.Declaration,
            private elementsToInsert: Syntax.Node[]) {
            super();
        }

        public toString(): string {
            return "Cannot substitute '" + this.declaration + "' with " +
                this.elementsToInsert.map(e => "'" + e.toString() + "'").join(" and ") + " at the same time.";
        }
    }


}

