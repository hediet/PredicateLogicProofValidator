module FirstOrderPredicateLogic.Syntax {

    export class UnaryOperation extends Operation {

        constructor(operationFactory: OperationFactory, arg: Formula) {
            super(operationFactory, [arg]);
        }

        public toString(args: IFormulaToStringArgs = defaultFormulaToStringArgs): string {

            var subArgs = {
                forceParenthesis: args.forceParenthesis,
                parentOperatorPriority: this.getOperationFactory().getPriority(),
                useUnicode: args.useUnicode
            };

            var result = this.getOperationFactory().getName(args.useUnicode) + this.getArguments()[0].toString(subArgs);

            if (args.parentOperatorPriority > subArgs.parentOperatorPriority || args.forceParenthesis)
                result = "(" + result + ")";

            return result;
        }
    }

    export class BinaryOperation extends Operation {

        constructor(operationFactory: OperationFactory, leftArg: Formula, rightArg: Formula) {
            super(operationFactory, [leftArg, rightArg]);
        }

        public toString(args: IFormulaToStringArgs = defaultFormulaToStringArgs): string {

            var subArgs1 = {
                forceParenthesis: args.forceParenthesis,
                parentOperatorPriority: this.getOperationFactory().getPriority(),
                useUnicode: args.useUnicode
            };

            var subArgs2 = {
                forceParenthesis: args.forceParenthesis,
                parentOperatorPriority: this.getOperationFactory().getPriority() + 1,
                useUnicode: args.useUnicode
            };

            var result = this.getArguments()[0].toString(subArgs1) + " " +
                this.getOperationFactory().getName(args.useUnicode) + " " + this.getArguments()[1].toString(subArgs2);

            if (args.parentOperatorPriority > subArgs1.parentOperatorPriority || args.forceParenthesis)
                result = "(" + result + ")";

            return result;
        }
    }


    export class Equivalence extends BinaryOperation {
        static factory = new OperationFactory("<->", "↔", 2, 100, (args, of) => new Equivalence(of, args[0], args[1]));
    }

    export class Implication extends BinaryOperation {
        static factory = new OperationFactory("->", "→",  2, 100, (args, of) => new Implication(of, args[0], args[1]));
    }

    export class Or extends BinaryOperation {
        static factory = new OperationFactory("|", "∨", 2, 300, (args, of) => new Or(of, args[0], args[1]));
    }

    export class And extends BinaryOperation {
        static factory = new OperationFactory("&", "∧", 2, 400, (args, of) => new And(of, args[0], args[1]));
    }

    export class Negation extends UnaryOperation {
        static factory = new OperationFactory("!", "¬", 1, 500, (args, of) => new Negation(of, args[0]));
    }
}