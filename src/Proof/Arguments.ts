module FirstOrderPredicateLogic.Proof {

    export class Parameter {

        public static fromDeclarations(decls: any[]): Parameter[] {

            return decls.map(d => {
                if (d instanceof Syntax.FormulaDeclaration) {
                    return <Parameter>new FormulaParameter(d);
                }
                if (d instanceof Syntax.VariableDeclaration) {
                    return new VariableParameter(d);
                }
            });

        }

        public getName(): string {
            throw "abstract";
        }

        public createArgument(arg: any): Argument {
            throw "abstract";
        }
    }

    export class VariableParameter extends Parameter {

        private sourceVariable: Syntax.VariableDeclaration;

        constructor(sourceVariable: Syntax.VariableDeclaration) {
            super();
            this.sourceVariable = sourceVariable;
        }

        public getName(): string {
            return this.sourceVariable.getName();
        }

        public getSourceVariable(): Syntax.VariableDeclaration {
            return this.sourceVariable;
        }

        public createArgument(arg: any): VariableArgument {
            return new VariableArgument(this, arg);
        }
    }

    export class FormulaParameter extends Parameter {
        private sourceFormulaDeclaration: Syntax.FormulaDeclaration;

        constructor(sourceFormulaDeclaration: Syntax.FormulaDeclaration) {
            super();
            this.sourceFormulaDeclaration = sourceFormulaDeclaration;
        }

        public getName(): string {
            return this.sourceFormulaDeclaration.getName();
        }


        public getSourceFormulaDeclaration(): Syntax.FormulaDeclaration {
            return this.sourceFormulaDeclaration;
        }

        public createArgument(arg: any): FormulaArgument {
            return new FormulaArgument(this, arg);
        }
    }
    /*
    export class TermParameter extends Parameter {
        private sourceFormulaDeclaration: Syntax.VariableDeclaration;

        constructor(sourceFormulaDeclaration: Syntax.VariableDeclaration) {
            super();
            this.sourceFormulaDeclaration = sourceFormulaDeclaration;
        }

        public getSourceFormulaDeclaration(): Syntax.FormulaDeclaration {
            return this.sourceFormulaDeclaration;
        }

        public createArgument(arg: any): FormulaArgument {
            return new TermArgument(this, arg);
        }
    }*/

    export class Argument {
        
        public static fromValues(paremeters: Parameter[], values: any[]): Argument[] {
            return paremeters.map((d, i) => d.createArgument(values[i]));
        }

        public getParameter(): Parameter {
            throw "abstract";
        }
    }

    export class VariableArgument {

        private parameter: VariableParameter;
        private argument: Syntax.VariableDeclaration;

        constructor(parameter: VariableParameter, argument: Syntax.VariableDeclaration) {
            this.parameter = parameter;
            this.argument = argument;
        }

        public getParameter(): VariableParameter {
            return this.parameter;
        }

        public getArgument(): Syntax.VariableDeclaration {
            return this.argument;
        }
    }

    export class FormulaArgument {
        private parameter: FormulaParameter;
        private argument: Syntax.Formula;

        constructor(parameter: FormulaParameter, argument: Syntax.Formula) {
            this.parameter = parameter;
            this.argument = argument;
        }

        public getParameter(): FormulaParameter {
            return this.parameter;
        }

        public getArgument(): Syntax.Formula {
            return this.argument;
        }
    }

}