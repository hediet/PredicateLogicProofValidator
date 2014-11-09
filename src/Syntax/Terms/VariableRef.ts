﻿module FirstOrderPredicateLogic.Syntax {

    export class VariableRef extends Term {

        private variableDeclaration: VariableDeclaration;

        constructor(variableDeclaration: VariableDeclaration) {
            super();

            Common.ArgumentExceptionHelper.ensureTypeOf(variableDeclaration, VariableDeclaration, "variableDeclaration");

            this.variableDeclaration = variableDeclaration;
        }

        public getDeclarations(): Declaration[] {
            return [this.variableDeclaration];
        }

        public getVariables(): VariableDeclaration[] {
            return [this.variableDeclaration];
        }

        public getVariableDeclaration(): VariableDeclaration {
            return this.variableDeclaration;
        }

        public substitute(substitutions: Substitution[]): Term {
            return new VariableRef(this.variableDeclaration.substitute(substitutions));
        }

        public resubstitute(concreteFormula: Term, collector: ISubstitutionCollector) {
            if (!(concreteFormula instanceof VariableRef))
                collector.addIncompatibleNodes(this, concreteFormula);
            else 
                collector.addSubstitution(new VariableSubstition(this.getVariableDeclaration(),
                    (<VariableRef>concreteFormula).getVariableDeclaration()));
        }

        public containsVariable(variable: VariableDeclaration): boolean {
            return variable.equals(this.variableDeclaration);
        }

        public substituteVariables(substitutions: VariableWithTermSubstitution[]): Term {

            return Common.firstOrDefault(substitutions, this,
                subst => subst.getVariableToSubstitute().equals(this.variableDeclaration)
                    ? subst.getTermToInsert() : null);
        }

        public processAppliedSubstitutions(): Term {
            return this;
        }

        public toString() {
            return this.variableDeclaration.getName();
        }
    }
}