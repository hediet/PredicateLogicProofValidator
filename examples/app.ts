


/*
import s = FirstOrderPredicateLogic.Syntax;
import p = FirstOrderPredicateLogic.Parser;
import pr = FirstOrderPredicateLogic.Proof;

var termParser = new p.TermParser();
var formulaParser = new p.FormulaParser(termParser, [s.Equivalence.factory, s.Implication.factory, s.Or.factory, s.And.factory, s.Negation.factory]);

var documentParser = new p.DocumentParser(formulaParser, termParser);



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

            var formulaBuilders: { [id: string]: pr.ProofableFormulaBuilder } = {};
            var rules: { [id: string]: pr.Rule } = {};

            result.getDescriptions().forEach(d => {

                if (d instanceof pr.AxiomDescription) {

                    var ad = <pr.AxiomDescription>d;
                    var ax = new pr.Axiom(ad.getName(), ad.getSymbols(), ad.getAssertion());
                    formulaBuilders[ax.getName()] = ax;

                }
                else if (d instanceof pr.RuleDescription) {

                    var rd = <pr.RuleDescription>d;
                    var rule = new pr.Rule(rd.getName(), rd.getSymbols(), rd.getConclusion(), rd.getAssumptions());
                    rules[rule.getName()] = rule;

                } else if (d instanceof pr.TheoremDescription) {

                    var steps: { [id: string]: pr.Step } = {};

                    var td = <pr.TheoremDescription>d;
                    td.getProofSteps().forEach(step => {

                        var newStep: pr.Step = null;

                        ax = formulaBuilders[step.getOperation()];

                        if (typeof ax !== "undefined") {
                            if (ax === null || typeof ax === "undefined")
                                return;

                            var args = step.getArguments().map(a => {
                                if (a instanceof pr.StepRef) {
                                    var referencedStepName = (<pr.StepRef>a).getReferencedStep();
                                    return steps[referencedStepName].getDeductedFormula();
                                }
                                return a;
                            });

                            newStep = new pr.ProofableFormulaBuilderStep(ax, s.Substition.fromValues(ax.getParameters(), args));
                        } else {

                            var stepArgs = step.getArguments().slice(0);
                            var rule = rules[step.getOperation()];
                            var providedAssumptions: pr.StepRef[] = [];
                            rule.getAssumptions().forEach(a => {
                                providedAssumptions.push(stepArgs.shift());
                            });

                            var providedAssumptionsSteps = providedAssumptions.map(s => steps[s.getReferencedStep()]);

                            newStep = new pr.RuleStep(rule, providedAssumptionsSteps, stepArgs);
                        }


                        steps[step.getStepIdentifier()] = newStep;

                        var text = "⊢ " + newStep.getDeductedFormula().toString({
                            forceParenthesis: false, parentOperatorPriority: 0, useUnicode: true
                        });
                        var pos = p.TextRegion.getRegionOf(step);
                        var line = pos.getStartLine() - 1;
                        var msg = document.createElement("div");

                        var l: string = editor.getLine(line);
                        var space = l.substr(0, pos.getStartColumn());

                        msg.innerHTML = "<pre>  " + space + text + "</pre>";

                        msg.className = "proof-step-formula";


                        var widget = editor.addLineWidget(line, msg, { coverGutter: false, noHScroll: true });
                        widgets.push(widget);

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

*/