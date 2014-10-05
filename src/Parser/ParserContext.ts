﻿module FirstOrderPredicateLogic.Parser {


    export interface IParserContext {
        /**
         * @return the declaration of the function or null, if functionName is not a reference to a function.
         */
        getFunctionDeclaration(functionName: string): Syntax.FunctionDeclaration;
        getPredicateDeclaration(predicateName: string): Syntax.PredicateDeclaration;
        getFormulaDeclaration(formulaName: string): Syntax.FormulaDeclaration;
        getVariableDeclaration(variableName: string): Syntax.VariableDeclaration;
        getTermDeclaration(termName: string): Syntax.TermDeclaration;
    }


    export class ParserContext implements IParserContext {

        private declaredFunctions: { [id: string]: Syntax.FunctionDeclaration } = {};
        private declaredPredicates: { [id: string]: Syntax.PredicateDeclaration } = {};
        private declaredFormulas: { [id: string]: Syntax.FormulaDeclaration } = {};
        private declaredVariables: { [id: string]: Syntax.VariableDeclaration } = {};
        private declaredTerms: { [id: string]: Syntax.TermDeclaration } = {};

        constructor(declarations: Syntax.Declaration[]) {

            declarations.forEach(d => {
                if (d instanceof Syntax.FunctionDeclaration)
                    this.declaredFunctions[d.getName()] = <Syntax.FunctionDeclaration>d;
                else if (d instanceof Syntax.PredicateDeclaration)
                    this.declaredPredicates[d.getName()] = <Syntax.PredicateDeclaration>d;
                else if (d instanceof Syntax.FormulaDeclaration)
                    this.declaredFormulas[d.getName()] = <Syntax.FormulaDeclaration>d;
                else if (d instanceof Syntax.VariableDeclaration)
                    this.declaredVariables[d.getName()] = <Syntax.VariableDeclaration>d;
                else if (d instanceof Syntax.TermDeclaration)
                    this.declaredTerms[d.getName()] = <Syntax.TermDeclaration>d;
            });
        }

        public getFunctionDeclaration(functionName: string): Syntax.FunctionDeclaration {

            if (typeof this.declaredFunctions[functionName] !== "undefined") {
                return this.declaredFunctions[functionName];
            }

            return null;
        }

        public getPredicateDeclaration(predicateName: string): Syntax.PredicateDeclaration {

            if (typeof this.declaredPredicates[predicateName] !== "undefined") {
                return this.declaredPredicates[predicateName];
            }

            return null;
        }

        public getFormulaDeclaration(formulaName: string): Syntax.FormulaDeclaration {
            if (typeof this.declaredFormulas[formulaName] !== "undefined") {
                return this.declaredFormulas[formulaName];
            }

            return null;
        }

        public getVariableDeclaration(variableName: string): Syntax.VariableDeclaration {
            if (typeof this.declaredVariables[variableName] !== "undefined") {
                return this.declaredVariables[variableName];
            }

            return new Syntax.VariableDeclaration(variableName);
        }

        public getTermDeclaration(termName: string): Syntax.TermDeclaration {
            if (typeof this.declaredTerms[termName] !== "undefined") {
                return this.declaredTerms[termName];
            }

            return null;
        }
    }
}