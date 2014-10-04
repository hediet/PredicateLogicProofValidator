
module FirstOrderPredicateLogic.Syntax {


    export class PredicateDeclaration extends Declaration {
        
        private arity: number;

        constructor(name: string, arity: number) {
            super(name);
            this.arity = arity;
        }

        public getArity(): number {
            return this.arity;
        }

        public toString(): string {
            return "Predicate declaration of " + this.getName();
        }
    }


    export interface IFormulaToStringArgs {
        parentOperatorPriority: number;
        forceParenthesis: boolean;
    }

    export var defaultFormulaToStringArgs: IFormulaToStringArgs = { forceParenthesis: false, parentOperatorPriority: 0 };

    export interface IResubstitutionService {
        addSubstitution(substitution: Substition): void;
        addIncompatibleNodes(genericFormula: Formula, specialFormula: Formula): void;
    }

    export class Formula {

        public isSubstitutionCollisionFree(substitution: VariableWithTermSubstitution): boolean {
            throw "This method is abstract";
        }

        public substituteUnboundVariables(substitutions: VariableWithTermSubstitution[]): Formula {
            throw "This method is abstract";
        }

        public substitute(substitutions: Substition[]): Formula {
            throw "This method is abstract";
        }

        public resubstitute(instance: Formula, substService: IResubstitutionService) {
            throw "This method is abstract";
        }

        public applySubstitutions(): Formula {
            throw "This method is abstract";
        }

        public getUnboundVariables(): VariableDeclaration[] {
            throw "This method is abstract";
        }

        public getVariables(): VariableDeclaration[] {
            throw "This method is abstract";
        }

        public containsUnboundVariable(variable: VariableDeclaration): boolean {
            throw "This method is abstract";
        }

        public getFormulaRefs(): FormulaDeclaration[] {
            throw "This method is abstract";
        }

        public toString(args: IFormulaToStringArgs = defaultFormulaToStringArgs): string {
            throw "This method is abstract";
        }
    }

    export class FormulaDeclaration extends Declaration {

        public toString(): string {
            return "Formula declaration of " + this.getName();
        }
    }


    export class FormulaRef extends Formula {

        private fd: FormulaDeclaration;

        constructor(fd: FormulaDeclaration) {
            super();
            this.fd = fd;
        }

        public getFormula(): FormulaDeclaration {
            return this.fd;
        }


        public isSubstitutionCollisionFree(substitution: VariableWithTermSubstitution): boolean {
            return true;
        }

        public substituteUnboundVariables(substitutions: VariableWithTermSubstitution[]): Formula {

            var result: Formula = this;
            substitutions.forEach(s => {
                result = new AppliedSubstitution(result, s.getVariableToSubstitute(), s.getTermToInsert());
            });

            return result;
        }

        public substitute(substitutions: Substition[]): Formula {

            var result: Formula = this;
            substitutions.some(s => {
                if (s instanceof FormulaRefWithFormulaSubstitution) {
                    var sub = <FormulaRefWithFormulaSubstitution>s;
                    if (sub.getFormulaToSubstitute().getName() == this.getFormula().getName()) {
                        result = sub.getFormulaToInsert();
                        return true;
                    }
                }
                return false;
            });

            return result;
        }

        public resubstitute(instance: Formula, substService: IResubstitutionService) {
            substService.addSubstitution(new FormulaRefWithFormulaSubstitution(this.fd, instance));
        }

        public applySubstitutions(): Formula {
            return this;
        }

        public getUnboundVariables(): VariableDeclaration[] {
            return [];
        }

        public getVariables(): VariableDeclaration[] {
            throw "This method is abstract";
        }

        public getFormulaRefs(): FormulaDeclaration[] {
            return [this.getFormula()];
        }

        public toString(args: IFormulaToStringArgs = defaultFormulaToStringArgs): string {
            return this.fd.getName();
        }
    }



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

            var subs = substitutions.filter(s => s instanceof VariableWithVariableSubstition).map(s =>
                new VariableWithTermSubstitution((<VariableWithVariableSubstition>s).getVariableToSubstitute(),
                    new VariableRef((<VariableWithVariableSubstition>s).getVariableToInsert())));

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

        public getUnboundVariables(): VariableDeclaration[]{
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



    export class AllQuantor extends Formula {

        public static getPriority() {
            return 1000;
        }

        private formula: Formula;
        private boundVariable: VariableDeclaration;

        constructor(boundVariable: VariableDeclaration, formula: Formula) {
            super();

            this.boundVariable = boundVariable;
            this.formula = formula;
        }

        public getBoundVariable(): VariableDeclaration {
            return this.boundVariable;
        }

        public getFormula(): Formula {
            return this.formula;
        }

        public isSubstitutionCollisionFree(substitution: VariableWithTermSubstitution): boolean {
            if (substitution.getVariableToSubstitute().getName() == this.boundVariable.getName())
                return true; //only free variables can be replaced

            //termToInsert would replace at least one variable in 'formula',
            //so all variables of 'termToInsert' would appear in the qualified formula.
            //The substitution is not collision free, if the variable bound by this qualifier appears
            //unbound in 'termToInsert'.
            if (substitution.getTermToInsert().containsVariable(this.boundVariable)
                && this.formula.containsUnboundVariable(substitution.getVariableToSubstitute()))
                return false;

            return this.formula.isSubstitutionCollisionFree(substitution);
        }

        public substituteUnboundVariables(substitutions: VariableWithTermSubstitution[]): Formula {

            var subs = substitutions.filter(s => s.getVariableToSubstitute().getName() !== this.boundVariable.getName());

            return new AllQuantor(this.boundVariable, this.formula.substituteUnboundVariables(subs));
        }

        public substitute(substitutions: Substition[]): Formula {

            var newBoundVariable = this.boundVariable;

            substitutions.some(s => {
                if (s instanceof VariableWithVariableSubstition) {
                    var sub = <VariableWithVariableSubstition>s;
                    if (sub.getVariableToSubstitute().getName() === this.boundVariable.getName()) {
                        newBoundVariable = sub.getVariableToInsert();
                        return true;
                    }
                }
                return false;
            });

            return new AllQuantor(newBoundVariable, this.formula.substitute(substitutions));
        }

        public resubstitute(instance: Formula, substService: IResubstitutionService) {

            if (!(instance instanceof AllQuantor)) {
                substService.addIncompatibleNodes(this, instance);
                return;
            }

            var a = <AllQuantor>instance;
            var boundVariable = a.getBoundVariable();

            substService.addSubstitution(new VariableWithVariableSubstition(boundVariable, a.getBoundVariable()));
            this.formula.resubstitute(a.getFormula(), substService);
        }

        public applySubstitutions(): Formula {
            return new AllQuantor(this.boundVariable, this.formula.applySubstitutions());
        }

        public getVariables(): VariableDeclaration[] {
            var result: VariableDeclaration[] = this.formula.getVariables();
            result.push(this.boundVariable);
            result = Helper.unique(result, r => r.getName());

            return result;
        }


        public getUnboundVariables(): VariableDeclaration[] {
            var result = this.formula.getUnboundVariables();
            result = result.filter(t => t.getName() != this.boundVariable.getName());

            return result;
        }

        public getFormulaRefs(): FormulaDeclaration[] {
            return this.formula.getFormulaRefs();
        }

        public toString(args: IFormulaToStringArgs = defaultFormulaToStringArgs): string {

            var result = "forall " + this.boundVariable.getName() + ": " + this.formula.toString(
                { forceParenthesis: args.forceParenthesis, parentOperatorPriority: AllQuantor.getPriority() });

            if (args.forceParenthesis)
                result = "(" + result + ")";

            return result;
        }
    }




    

    export class Substition {

    }

    export class VariableWithVariableSubstition extends Substition {

        private variableToSubstitute: VariableDeclaration;
        private variableToInsert: VariableDeclaration;

        constructor(variableToSubstitute: VariableDeclaration, variableToInsert: VariableDeclaration) {

            Helper.ArgumentExceptionHelper.ensureTypeOf(variableToSubstitute, VariableDeclaration, "variableToSubstitute");
            Helper.ArgumentExceptionHelper.ensureTypeOf(variableToInsert, VariableDeclaration, "variableToInsert");
             
            super();
            this.variableToSubstitute = variableToSubstitute;
            this.variableToInsert = variableToInsert;
        }

        public getVariableToSubstitute(): VariableDeclaration {
            return this.variableToSubstitute;
        }

        public getVariableToInsert(): VariableDeclaration {
            return this.variableToInsert;
        }
    }

    export class FormulaRefWithFormulaSubstitution extends Substition {

        private formulaToSubstitute: FormulaDeclaration;
        private formulaToInsert: Formula;

        constructor(formulaToSubstitute: FormulaDeclaration, formulaToInsert: Formula) {
            super();
            this.formulaToSubstitute = formulaToSubstitute;
            this.formulaToInsert = formulaToInsert;
        }

        public getFormulaToSubstitute(): FormulaDeclaration {
            return this.formulaToSubstitute;
        }

        public getFormulaToInsert(): Formula {
            return this.formulaToInsert;
        }
    }


    export class AppliedSubstitution extends Formula {

        private formulaToSubstitute: Formula;
        private variableToSubstitute: VariableDeclaration;
        private termToInsert: Term;

        private substitutedFormula: Formula = null;

        constructor(formulaToSubstitute: Formula, variableToSubstitute: VariableDeclaration, termToInsert: Term) {
            super();

            this.formulaToSubstitute = formulaToSubstitute;
            this.variableToSubstitute = variableToSubstitute;
            this.termToInsert = termToInsert;
        }

        public getFormulaToSubstitute(): Formula {
            return this.formulaToSubstitute;
        }

        public getVariableToSubstitute(): VariableDeclaration {
            return this.variableToSubstitute;
        }

        public getTermToInsert(): Term {
            return this.termToInsert;
        }

        public isCollisionFree(): boolean {
            return this.formulaToSubstitute.isSubstitutionCollisionFree(
                new VariableWithTermSubstitution(this.variableToSubstitute, this.termToInsert));
        }

        public getSubstitutedFormula(): Formula {

            if (this.substitutedFormula === null) {
                this.substitutedFormula = this.formulaToSubstitute.substituteUnboundVariables(
                    [new VariableWithTermSubstitution(this.variableToSubstitute, this.termToInsert)]);
            }

            return this.substitutedFormula;
        }




        public isSubstitutionCollisionFree(substitution: VariableWithTermSubstitution): boolean {
            throw "This method is abstract";
        }

        public substituteUnboundVariables(substitutions: VariableWithTermSubstitution[]): Formula {
            throw "This method is abstract";
        }

        public substitute(substitutions: Substition[]): Formula {

            var newVariableToSubstitute = this.variableToSubstitute;

            substitutions.forEach(s => {
                if (s instanceof VariableWithVariableSubstition) {
                    var s1 = <VariableWithVariableSubstition>s;
                    if (s1.getVariableToSubstitute().getName() === this.variableToSubstitute.getName()) {
                        newVariableToSubstitute = s1.getVariableToInsert();
                    }
                }
            });

            var subs = substitutions.filter(s => s instanceof VariableWithVariableSubstition).map(s =>
                new VariableWithTermSubstitution((<VariableWithVariableSubstition>s).getVariableToSubstitute(),
                    new VariableRef((<VariableWithVariableSubstition>s).getVariableToInsert())));

            var newTermToInsert = this.termToInsert.substitute(subs);
            var newFormulaToSubstitute = this.formulaToSubstitute.substitute(substitutions);

            return new AppliedSubstitution(newFormulaToSubstitute, newVariableToSubstitute, newTermToInsert);
        }

        public applySubstitutions(): Formula {
            return this.getSubstitutedFormula();
        }

        public getUnboundVariables(): VariableDeclaration[] {
            return [];
        }

        public getVariables(): VariableDeclaration[] {
            return []; //TODO
        }

        public getFormulaRefs(): FormulaDeclaration[] {
            return []; //TODO
        }

        public toString(args: IFormulaToStringArgs = defaultFormulaToStringArgs): string {

            var subArgs = { forceParenthesis: args.forceParenthesis, parentOperatorPriority: 0 };

            return "(" + this.formulaToSubstitute.toString(subArgs) + ")"
                + "[" + this.variableToSubstitute.getName() + " <- " + this.termToInsert.toString() + "]";
        }
    }
}