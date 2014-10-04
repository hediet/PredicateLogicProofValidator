




var s = FirstOrderPredicateLogic.Syntax;
var p = FirstOrderPredicateLogic.Parser;
var pr = FirstOrderPredicateLogic.Proof;

var termParser = new p.TermParser();
var parsedTerm = termParser.parseTerm(
    new p.Tokenizer("g(a, h(b), c)"),
    new p.ParserContext([new s.FunctionDeclaration("g", 3), new s.FunctionDeclaration("h", 1)]));

//console.log(parsedTerm.toString());


var formulaParser = new p.FormulaParser(termParser, [s.Equivalence.factory, s.Implication.factory, s.Or.factory, s.And.factory, s.Negation.factory]);
var c = new p.ParserContext(
    [
        new s.FunctionDeclaration("g", 3), new s.FunctionDeclaration("h", 1),
        new s.PredicateDeclaration("A", 3), new s.PredicateDeclaration("B", 3), new s.PredicateDeclaration("C", 3),
        new s.FormulaDeclaration("phi")
    ]);
var parseF = (s: string, c: FirstOrderPredicateLogic.Parser.IParserContext)
    => formulaParser.parseFormula(new p.Tokenizer(s), c);

var parsedFormula = parseF("(A -> forall a: (B -> C(a,b)) -> phi)[a <- h(a)]", c);


console.log(parsedFormula.substitute(
    [
        new s.VariableWithVariableSubstition(
            c.getVariableDeclaration("a"),
            c.getVariableDeclaration("b"))
    ]));


var placeholders = [new s.FormulaDeclaration("phi"), new s.FormulaDeclaration("psi")];
var c1 = new p.ParserContext(placeholders);

var axiom1 = new pr.Axiom("A1", pr.Parameter.fromDeclarations(placeholders),
    parseF("phi -> (psi -> phi)", c1));

var axiomStep = new pr.ProofableFormulaBuilderStep(axiom1,
    pr.Argument.fromValues(axiom1.getParameters(), [parseF("phi -> phi", c), parseF("A", c)]));

console.log(axiomStep.getDeductedFormula().toString());


var documentParser = new p.DocumentParser(formulaParser,  termParser);




declare var CodeMirror: any;
window.onload = () => {
    
    var editor = CodeMirror.fromTextArea(document.getElementById("code"), {
        lineNumbers: true,
        styleActiveLine: true,
        matchBrackets: true,
        viewportMargin: Infinity
    });

    editor.on("renderLine", function (cm, line, elt) {
        console.log({ l: line, e: elt });
        
    });

    var widgets = [];

    var update = () => {


        editor.operation(function () {
            for (var i = 0; i < widgets.length; ++i)
                editor.removeLineWidget(widgets[i]);
            widgets.length = 0;

            var result = documentParser.parseStr(editor.getValue());

            var formulaBuilders: { [id: string]: FirstOrderPredicateLogic.Proof.ProofableFormulaBuilder } = {};
            var rules: { [id: string]: FirstOrderPredicateLogic.Proof.Rule } = {};

            result.getDescriptions().forEach(d => {

                if (d instanceof FirstOrderPredicateLogic.Proof.AxiomDescription) {

                    var ad = <FirstOrderPredicateLogic.Proof.AxiomDescription>d;
                    var ax = new pr.Axiom(ad.getName(), pr.Parameter.fromDeclarations(ad.getSymbols()), ad.getAssertion());
                    formulaBuilders[ax.getName()] = ax;

                }
                else if (d instanceof FirstOrderPredicateLogic.Proof.RuleDescription) {

                    var rd = <FirstOrderPredicateLogic.Proof.RuleDescription>d;
                    var parameters = pr.Parameter.fromDeclarations(rd.getSymbols());
                    var rule = new pr.Rule(rd.getName(), parameters, rd.getConclusion(), rd.getAssumptions());
                    rules[rule.getName()] = rule;

                } else if (d instanceof FirstOrderPredicateLogic.Proof.TheoremDescription) {

                    var steps: { [id: string]: FirstOrderPredicateLogic.Proof.Step } = {};

                    var td = <FirstOrderPredicateLogic.Proof.TheoremDescription>d;
                    td.getProofSteps().forEach(step => {
                        
                        var newStep: FirstOrderPredicateLogic.Proof.Step = null;

                        ax = formulaBuilders[step.getOperation()];

                        if (typeof ax !== "undefined") {
                            if (ax === null || typeof ax === "undefined")
                                return;

                            var args = step.getArguments().map(a => {
                                if (a instanceof pr.StepRef) {
                                    var referencedStepName = (<FirstOrderPredicateLogic.Proof.StepRef>a).getReferencedStep();
                                    return steps[referencedStepName].getDeductedFormula();
                                }
                                return a;
                            });

                            newStep = new pr.ProofableFormulaBuilderStep(ax, pr.Argument.fromValues(
                                ax.getParameters(), args));
                        } else {

                            var stepArgs = step.getArguments().slice(0);
                            var rule = rules[step.getOperation()];
                            var providedAssumptions: FirstOrderPredicateLogic.Proof.StepRef[] = [];
                            rule.getAssumptions().forEach(a => {
                                providedAssumptions.push(stepArgs.shift());
                            });

                            var providedAssumptionsSteps = providedAssumptions.map(s => steps[s.getReferencedStep()]);

                            newStep = new pr.RuleStep(rule, providedAssumptionsSteps, stepArgs);
                        }


                        steps[step.getStepIdentifier()] = newStep;

                        var text = "|- " + newStep.getDeductedFormula().toString();
                        var pos = p.TextRegion.getRegionOf(step);
                        var line = pos.getStartLine() - 1;
                        var msg = document.createElement("div");

                        var l: string = editor.getLine(line);
                        var space = l.substr(0, pos.getStartColumn());

                        msg.innerHTML = "<pre>  " + space + text + "</pre>";

                        msg.className = "proof-step-formula";
                        widgets.push(editor.addLineWidget(line, msg, { coverGutter: false, noHScroll: true }));

                    });
                }
            });

        });

    };

    update();

    var waiting;
    editor.on("change", function () {
        clearTimeout(waiting);
        waiting = setTimeout(update, 500);
    });
}

