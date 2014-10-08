
///<reference path="definitions.d.ts"/>


import defaultText = require("text!default.txt");
import $ = require("jquery");
import CodeMirror = require("Codemirror");
import FirstOrderPredicateLogic = require("FirstOrderPredicateLogic");

import s = FirstOrderPredicateLogic.Syntax;
import p = FirstOrderPredicateLogic.Parser;
import pr = FirstOrderPredicateLogic.Proof;





















class EndOfLineWidget {

    constructor(public node: HTMLElement,
        public lineHandle: CodeMirror.LineHandle,
        public alignmentBlock: WidgetAlignmentBlock) {

    }


}


class WidgetAlignmentBlock {
   
    constructor(public id: number) {
    }
}

class EndOfLineWidgetManager {

    private widgets: EndOfLineWidget[] = [];
    private id: number = 0;

    constructor(private editor: CodeMirror.Editor) {

        editor.on("change", () => this.update());

    }

    private update() {

        var alignmentBlockWidths: { [id: number]: number } = { };

        this.widgets.forEach(w => {

            if (w.alignmentBlock === null)
                return;

            var info = this.editor.lineInfo(w.lineHandle);
            if (info === null)
                return;

            var line = info.line;
            var column = info.text.length - 1;

            var coords = this.editor.charCoords({ line: line, ch: column }, "window");

            if (typeof alignmentBlockWidths[w.alignmentBlock.id] === "undefined")
                alignmentBlockWidths[w.alignmentBlock.id] = coords.right;
            else 
                alignmentBlockWidths[w.alignmentBlock.id] = Math.max(alignmentBlockWidths[w.alignmentBlock.id], coords.right);
        });
        var first = true;
        this.widgets.forEach(w => {

            var info = this.editor.lineInfo(w.lineHandle);
            var line = info.line;
            var column = info.text.length - 1;

            var coords = this.editor.charCoords({ line: line, ch: column }, "local");
            if (first) {
                console.log(coords);
                first = false;
            }
            if (typeof alignmentBlockWidths[w.alignmentBlock.id] !== "undefined")
                coords.right = alignmentBlockWidths[w.alignmentBlock.id];

            w.node.style.left = coords.right + "px";
            w.node.style.top = coords.top + "px";
        });
    }

    public addAlignmentBlock(): WidgetAlignmentBlock {
        return new WidgetAlignmentBlock(this.id++);
    }

    public addLineWidget(line: number, node: HTMLElement, alignmentBlock: WidgetAlignmentBlock = null): EndOfLineWidget {

        node.style.position = "absolute";

        this.editor.getWrapperElement().appendChild(node);

        var lineHandler = this.editor.getDoc().getLineHandle(line);
        var result = new EndOfLineWidget(node, lineHandler, alignmentBlock);
        this.widgets.push(result);
        this.update();
        return result;
    }

    public removeLineWidget(widget: EndOfLineWidget) {

        var index = this.widgets.indexOf(widget);
        this.widgets.splice(index, 1);

        widget.node.parentNode.removeChild(widget.node);
    }
}






























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

var widgetManager = new EndOfLineWidgetManager(editor);

var storedWidgets: EndOfLineWidget[] = [];





var update = () => {


    editor.operation(function () {

        for (var i = 0; i < storedWidgets.length; ++i)
            widgetManager.removeLineWidget(storedWidgets[i]);

        storedWidgets.length = 0;

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

                var currentBlock = widgetManager.addAlignmentBlock();

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
                    var text = newStep.getDeductedFormula().toString({
                        forceParenthesis: false, parentOperatorPriority: 0, useUnicode: true
                    });
                    var pos = p.TextRegion.getRegionOf(step);
                    var line = pos.getStartLine() - 1;
                    var msg = document.createElement("div");

                    msg.innerHTML = '<span class="hypotheses">' + hypotheses + "</span>⊢ " + text;
                    msg.className = "proof-step-formula";

                    var widget = widgetManager.addLineWidget(line, msg, currentBlock);
                    storedWidgets.push(widget);
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





