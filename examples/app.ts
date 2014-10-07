
///<reference path="definitions.d.ts"/>


import defaultText = require("text!default.txt");
import $ = require("jquery");
import CodeMirror = require("Codemirror");
import FirstOrderPredicateLogic = require("FirstOrderPredicateLogic");

import s = FirstOrderPredicateLogic.Syntax;
import p = FirstOrderPredicateLogic.Parser;
import pr = FirstOrderPredicateLogic.Proof;


$("#code").text(defaultText);


var termParser = new p.TermParser();
var formulaParser = new p.FormulaParser(termParser,
    [s.Equivalence.factory, s.Implication.factory, s.Or.factory, s.And.factory, s.Negation.factory]);

var supportedConditions = [pr.IsCollisionFreeCondition.getInstance(), pr.DoesNotContainFreeVariableCondition.getInstance(),
    pr.OnlyContainsSpecifiedFreeVariablesCondition.getInstance()];

var documentParser = new p.DocumentParser(formulaParser, termParser, supportedConditions);


var editor = CodeMirror.fromTextArea(<HTMLTextAreaElement>document.getElementById("code"), {
    lineNumbers: true,
    styleActiveLine: true,
    matchBrackets: true,
    viewportMargin: Infinity
});


var widgets: CodeMirror.LineWidget[] = [];

var update = () => {


    editor.operation(function () {
        for (var i = 0; i < widgets.length; ++i)
            widgets[i].clear();

        widgets.length = 0;

        var result = documentParser.parseStr(editor.getDoc().getValue());

        var formulaBuilders: { [id: string]: pr.ProofableFormulaBuilder } = {};
        var rules: { [id: string]: pr.Rule } = {};

        result.getDescriptions().forEach(d => {

            if (d instanceof pr.AbstractAxiomDescription) {
                formulaBuilders[d.getName()] = d.getFormulaBuilder();
            }
            else if (d instanceof pr.AbstractRuleDescription) {
                var rd = <pr.RuleDescription>d;
                rules[d.getName()] = rd.getFormulaBuilder();

            } else if (d instanceof pr.TheoremDescription) {

                var steps: { [id: string]: pr.Step } = {};

                var td = <pr.TheoremDescription>d;

                var context = new s.ConditionContext(td.getConditions());

                formulaBuilders[d.getName()] = td.getFormulaBuilder();

                td.getProofSteps().forEach(step => {
                    var newStep: pr.Step;

                    var ax = formulaBuilders[step.getOperation()];

                    if (typeof ax !== "undefined") {
                        if (ax === null)
                            return;

                        var args = step.getArguments().map(a => {
                            if (a instanceof pr.StepRef) {
                                var referencedStepName = (<pr.StepRef>a).getReferencedStep();
                                return steps[referencedStepName].getDeductedFormula();
                            }
                            return a;
                        });

                        newStep = new pr.ProofableFormulaBuilderStep(ax, s.Substitution.fromValues(ax.getParameters(), args), context);
                    } else {

                        var stepArgs = step.getArguments().slice(0);
                        var rule = rules[step.getOperation()];
                        var providedAssumptions: pr.StepRef[] = [];
                        rule.getAssumptions().forEach(a => {
                            providedAssumptions.push(stepArgs.shift());
                        });

                        var providedAssumptionsSteps = providedAssumptions.map(s => steps[s.getReferencedStep()]);

                        newStep = new pr.RuleStep(rule, providedAssumptionsSteps, s.Substitution.fromValues(rule.getNecessaryParameters(), stepArgs), context);
                    }


                    steps[step.getStepIdentifier()] = newStep;

                    var hypotheses = "";
                    if (newStep.getHypotheses().length > 0) {
                        hypotheses = "{ " + newStep.getHypotheses().map(h => h.toString({
                            forceParenthesis: false,
                            parentOperatorPriority: 0,
                            useUnicode: true
                        })).join(", ") + " } ";
                    }
                    var text = hypotheses + "⊢ " + newStep.getDeductedFormula().toString({
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

setTimeout(update, 10);



var waiting;
editor.on("change", () => {
    clearTimeout(waiting);
    waiting = setTimeout(update, 500);
});

