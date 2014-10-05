
///<reference path="../lib/DefinitelyTyped/requirejs/require.d.ts"/>
///<reference path="../lib/DefinitelyTyped/codemirror/codemirror.d.ts"/>
///<reference path="../lib/DefinitelyTyped/jquery/jquery.d.ts"/>
///<reference path="definitions.d.ts"/>


import t = require("text!default.txt");
import $ = require("jquery");
import CodeMirror = require("Codemirror");
import FirstOrderPredicateLogic = require("FirstOrderPredicateLogic");

import s = FirstOrderPredicateLogic.Syntax;
import p = FirstOrderPredicateLogic.Parser;
import pr = FirstOrderPredicateLogic.Proof;


$("#code").text(t);


var termParser = new p.TermParser();
var formulaParser = new p.FormulaParser(termParser, [s.Equivalence.factory, s.Implication.factory, s.Or.factory, s.And.factory, s.Negation.factory]);

var documentParser = new p.DocumentParser(formulaParser, termParser);



var editor = CodeMirror.fromTextArea(<HTMLTextAreaElement>document.getElementById("code"), {
    lineNumbers: true,
    styleActiveLine: true,
    matchBrackets: true,
    viewportMargin: Infinity
});


var widgets: CodeMirror.LineWidget[] =  [];

var update = () => {


    editor.operation(function () {
        for (var i = 0; i < widgets.length; ++i)
            widgets[i].clear();

        widgets.length = 0;

        var result = documentParser.parseStr(editor.getDoc().getValue());

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

                        newStep = new pr.ProofableFormulaBuilderStep(ax, s.Substitution.fromValues(ax.getParameters(), args));
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

                    var l: string = editor.getDoc().getLine(line);
                    var space = l.substr(0, pos.getStartColumn() - 1);

                    msg.innerHTML = "<pre>   " + space + text + "</pre>";

                    msg.className = "proof-step-formula";


                    var widget = editor.addLineWidget(line, msg, { coverGutter: false, noHScroll: true, above: false, showIfHidden: false });
                    widgets.push(widget);

                });
            }
        });

    });

};

update();



var waiting;
editor.on("change", () => {
    clearTimeout(waiting);
    waiting = setTimeout(update, 500);
});

