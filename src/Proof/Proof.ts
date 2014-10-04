
module FirstOrderPredicateLogic.Proof {


    export class FormulaBuilder {

        private name: string;
        private parameters: Parameter[];
        private formulaTemplate: Syntax.Formula;

        constructor(name: string, placeholders: Parameter[], formulaTemplate: Syntax.Formula) {
            this.name = name;
            this.parameters = placeholders;
            this.formulaTemplate = formulaTemplate;
        }

        public getName(): string {
            return this.name;
        }

        public getParameters(): Parameter[] {
            return this.parameters;
        }

        public getFormulaTemplate(): Syntax.Formula {
            return this.formulaTemplate;
        }
    }

    export class ProofableFormulaBuilder extends FormulaBuilder {

    }

    export class Axiom extends ProofableFormulaBuilder {

    }

    export class Theorem extends ProofableFormulaBuilder {

    }


    export class Rule extends FormulaBuilder {

        private assumptions: Syntax.Formula[];

        constructor(name: string, parameters: Parameter[],
            formulaTemplate: Syntax.Formula, assumptions: Syntax.Formula[]) {

            super(name, parameters, formulaTemplate);
            this.assumptions = assumptions;
        }

        public getAssumptions(): Syntax.Formula[] {
            return this.assumptions;
        }

        public getNecessaryParameters(): Parameter[] {

            var usedFormulas: { [id: string]: Syntax.FormulaDeclaration } = {};
            this.assumptions.forEach((a: Syntax.Formula) => {
                a.getFormulaRefs().forEach(r => usedFormulas[r.getName()] = r);
            });

            var usedVariables: { [id: string]: Syntax.VariableDeclaration } = {};
            this.assumptions.forEach((a: Syntax.Formula) => {
                a.getVariables().forEach(r => usedVariables[r.getName()] = r);
            });

            return this.getParameters().filter(p => {
                if (p instanceof FormulaParameter) {
                    return !usedFormulas.hasOwnProperty(p.getName());
                }
                else if (p instanceof VariableParameter) {
                    return !usedVariables.hasOwnProperty(p.getName());
                }
            });
        }
    }



    export class Step {
        public getDeductedFormula(): Syntax.Formula {
            throw "abstract";
        }
    }

    export class ProofableFormulaBuilderStep extends Step {

        private pfb: ProofableFormulaBuilder;
        private args: Argument[];

        constructor(pfb: ProofableFormulaBuilder, args: Argument[]) {
            super();
            this.pfb = pfb;
            this.args = args;
        }

        public getArguments(): Argument[] {
            return this.args;
        }

        public getProofableFormulaBuilder(): ProofableFormulaBuilder {
            return this.pfb;
        }

        public getDeductedFormula(): Syntax.Formula {

            var substs: Syntax.Substition[] =
                this.args.map(a => {
                    if (a instanceof VariableArgument) {
                        var va = <VariableArgument>a;
                        return <Syntax.Substition>new Syntax.VariableWithVariableSubstition(
                            va.getParameter().getSourceVariable(), va.getArgument());
                    }
                    if (a instanceof FormulaArgument) {
                        var fa = <FormulaArgument>a;
                        return new Syntax.FormulaRefWithFormulaSubstitution(
                            fa.getParameter().getSourceFormulaDeclaration(), fa.getArgument());
                    }
                });

            return this.pfb.getFormulaTemplate().substitute(substs);
        }

    }

    export class RuleStep extends Step {

        private rule: Rule;
        private args: Argument[];
        private assumptions: Step[];

        constructor(rule: Rule, assumptions: Step[], args: Argument[]) {
            super();
            this.rule = rule;
            this.assumptions = assumptions;


            //check assumptions and infer arguments

            var substService = new ResubstitutionService();

            rule.getAssumptions().forEach((a: Syntax.Formula, idx) => {
                var providedAssumption = assumptions[idx];
                a.resubstitute(providedAssumption.getDeductedFormula(), substService);
            });

            if (substService.getIsError())
                throw "substitution error!";

            var newArgs: Argument[] = [];
            var indexedArgs: { [id: string]: Argument } = {};

            var parameters: { [id: string]: Parameter } = {};

            rule.getParameters().forEach(p => {
                parameters[p.getName()] = p;
            });

            //check against provided arguments
            substService.getSubstitutions().forEach(subst => {

                var argument: Argument = null;

                if (subst instanceof Syntax.VariableWithVariableSubstition) {
                    var vvsubst = <Syntax.VariableWithVariableSubstition>subst;

                    var param = parameters[vvsubst.getVariableToSubstitute().getName()];
                    argument = new VariableArgument(<VariableParameter>param, vvsubst.getVariableToInsert());
                }
                else if (subst instanceof Syntax.FormulaRefWithFormulaSubstitution) {
                    var ffsubst = <Syntax.FormulaRefWithFormulaSubstitution>subst;

                    var param = parameters[ffsubst.getFormulaToSubstitute().getName()];
                    argument = new FormulaArgument(<FormulaParameter>param, ffsubst.getFormulaToInsert());
                }

                newArgs.push(argument);
                indexedArgs[argument.getParameter().getName()] = argument;
            });


            args.forEach((arg: Argument) => {

                if (indexedArgs.hasOwnProperty(arg.getParameter().getName())) {
                    //todo check wether the arguments are equal
                } else {

                    newArgs.push(arg);
                }

            });

            this.args = newArgs;
        }

        public getRule(): Rule {
            return this.rule;
        }

        public getAssumptions(): Step[] {
            return this.assumptions;
        }

        public getDeductedFormula(): Syntax.Formula {

            var substs: Syntax.Substition[] =
                this.args.map(a => {
                    if (a instanceof VariableArgument) {
                        var va = <VariableArgument>a;
                        return <Syntax.Substition>new Syntax.VariableWithVariableSubstition(
                            va.getParameter().getSourceVariable(), va.getArgument());
                    }
                    if (a instanceof FormulaArgument) {
                        var fa = <FormulaArgument>a;
                        return new Syntax.FormulaRefWithFormulaSubstitution(
                            fa.getParameter().getSourceFormulaDeclaration(), fa.getArgument());
                    }
                });

            return this.rule.getFormulaTemplate().substitute(substs);

        }
    }


    class ResubstitutionService implements Syntax.IResubstitutionService {

        private error: boolean;
        private substitutions: { [id: string]: Syntax.Substition } = {};

        public getIsError(): boolean {
            return this.error;
        }

        public getSubstitutions(): Syntax.Substition[] {

            var result: Syntax.Substition[] = [];

            for (var propt in this.substitutions) {
                result.push(this.substitutions[propt]);
            }

            return result;
        }

        public addSubstitution(substitution: Syntax.Substition) {

            if (substitution instanceof Syntax.VariableWithVariableSubstition) {
                var s = <Syntax.VariableWithVariableSubstition>substitution;
                var name = s.getVariableToSubstitute().getName();

                var oldSubst = this.substitutions[name];
                if (typeof oldSubst === "undefined") {
                    this.substitutions[name] = s;
                } else {

                    if (!(oldSubst instanceof Syntax.VariableWithVariableSubstition))
                        this.error = true;
                    else {

                        var varToInsertName = (<Syntax.VariableWithVariableSubstition>oldSubst).getVariableToInsert().getName();

                        if (s.getVariableToInsert().getName() !== varToInsertName) {
                            this.error = true;
                        }
                    }
                }
            }


            if (substitution instanceof Syntax.FormulaRefWithFormulaSubstitution) {
                var s2 = <Syntax.FormulaRefWithFormulaSubstitution>substitution;
                var name = s2.getFormulaToSubstitute().getName();

                var oldSubst = this.substitutions[name];
                if (typeof oldSubst === "undefined") {
                    this.substitutions[name] = s2;
                } else {

                    if (!(oldSubst instanceof Syntax.FormulaRefWithFormulaSubstitution))
                        this.error = true;
                    else {

                        var formulaToInsert = (<Syntax.FormulaRefWithFormulaSubstitution>oldSubst).getFormulaToInsert();

                        if (s2.getFormulaToInsert() !== formulaToInsert) { //TODO
                            //this.error = true;
                        }
                    }
                }
            }

        }

        public addIncompatibleNodes(genericFormula: Syntax.Formula, specialFormula: Syntax.Formula) {
            this.error = true;
        }
    }

}

