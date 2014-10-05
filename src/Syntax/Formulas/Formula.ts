
module FirstOrderPredicateLogic.Syntax {

    export interface IFormulaToStringArgs {
        parentOperatorPriority: number;
        forceParenthesis: boolean;
        useUnicode: boolean;
    }

    export var defaultFormulaToStringArgs: IFormulaToStringArgs = { forceParenthesis: false, parentOperatorPriority: 0, useUnicode: false };

    export interface ISubstitutionCollector {
        addSubstitution(substitution: Substitution): void;
        addIncompatibleNodes(genericFormula: Node, specialFormula: Node): void;
    }


    class EqualitySubstitutionCollector {
        private areEqual: boolean = true;

        public getAreEqual(): boolean {
            return this.areEqual;
        }

        public addSubstitution(substitution: Substitution): void {
            if (!substitution.isIdentity())
                this.areEqual = false;
        }

        public addIncompatibleNodes(genericFormula: Formula, specialFormula: Formula): void {
            this.areEqual = false;
        }
    }

    export class Formula extends Node {

        public isSubstitutionCollisionFree(substitution: VariableWithTermSubstitution): boolean {
            throw "This method is abstract";
        }

        public substituteUnboundVariables(substitutions: VariableWithTermSubstitution[]): Formula {
            throw "This method is abstract";
        }

        public applySubstitutions(): Formula {
            throw "This method is abstract";
        }

        public getUnboundVariables(): VariableDeclaration[] {
            throw "This method is abstract";
        }

        public substitute(substitutions: Substitution[]): Formula {
            throw "This method is abstract";
        }

        /**
         * Collects the substitutions so that this.substitute(substitutions) equals specialFormula.
         */
        public resubstitute(specialFormula: Formula, substService: ISubstitutionCollector): void {
            throw "This method is abstract";
        }

        public containsUnboundVariable(variable: VariableDeclaration): boolean {
            return this.getUnboundVariables().map(v => v.getName()).indexOf(variable.getName()) !== -1;
        }

        public equals(other: Formula) {
            var s = new EqualitySubstitutionCollector();
            this.resubstitute(other, s);
            return s.getAreEqual();
        }

        public getDeclarations(): Declaration[] {
            throw "This method is abstract";
        }

        public toString(args: IFormulaToStringArgs = defaultFormulaToStringArgs): string {
            throw "This method is abstract";
        }
    }
}