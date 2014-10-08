
///<reference path="definitions.d.ts"/>


import defaultText = require("text!default.txt");
import $ = require("jquery");
import CodeMirror = require("Codemirror");
import FirstOrderPredicateLogic = require("FirstOrderPredicateLogic");

import s = FirstOrderPredicateLogic.Syntax;
import p = FirstOrderPredicateLogic.Parser;
import pr = FirstOrderPredicateLogic.Proof;

import EndOfLineWidgetManager = require("EndOfLineWidgetManager");



class App {
    
    private editor: CodeMirror.Editor;
    private widgetManager: EndOfLineWidgetManager.EndOfLineWidgetManager;
    private endOfLineWidgets: EndOfLineWidgetManager.EndOfLineWidget[] = [];
    private lineWidgets: CodeMirror.LineWidget[] = [];
    private documentParser: p.DocumentParser;

    constructor() {
        
        $("#code").text(defaultText);

        var termParser = new p.TermParser();
        var formulaParser = new p.FormulaParser(termParser,
            [s.Equivalence.factory, s.Implication.factory, s.Or.factory, s.And.factory, s.Negation.factory]);

        var supportedConditions = [pr.IsCollisionFreeCondition.getInstance(), pr.DoesNotContainFreeVariableCondition.getInstance(),
            pr.OnlyContainsSpecifiedFreeVariablesCondition.getInstance()];

        this.documentParser = new p.DocumentParser(formulaParser, termParser, supportedConditions);

        this.editor = CodeMirror.fromTextArea(<HTMLTextAreaElement>document.getElementById("code"), {
            lineNumbers: true,
            styleActiveLine: true,
            matchBrackets: true,
            viewportMargin: Infinity
        });

        this.widgetManager = new EndOfLineWidgetManager.EndOfLineWidgetManager(this.editor);

        setTimeout(() => this.editorChanged(), 10);

        var waiting;
        this.editor.on("change", () => {
            clearTimeout(waiting);
            waiting = setTimeout(() => this.editorChanged(), 500);
        });
    }




    private editorChanged() {
        

        for (var i = 0; i < this.endOfLineWidgets.length; ++i)
            this.widgetManager.removeLineWidget(this.endOfLineWidgets[i]);

        for (var i = 0; i < this.lineWidgets.length; ++i)
            this.lineWidgets[i].clear();

        this.endOfLineWidgets.length = 0;
        this.lineWidgets.length = 0;

        var result = this.documentParser.parseStr(this.editor.getDoc().getValue());

        var system = new pr.System(result);

        result.getDescriptions().forEach(d => {

            

            if (d instanceof pr.TheoremDescription) {
                var td = <pr.TheoremDescription>d;
                
                var text = "";
                if (system.getIsProven(td)) {
                    status = "proof-status-proven";
                    text = "This theorem is proved";
                } else {
                    status = "proof-status-invalid";
                    text = "This theorem is not proved";
                }

                var pos = p.TextRegion.getRegionOf(td);
                var line = pos.getStartLine() - 1;
                var msg = document.createElement("div");
                msg.innerHTML =  text;
                msg.className = "proof-status " + status;
                this.lineWidgets.push(this.editor.addLineWidget(line, msg, {
                    coverGutter: false,
                    noHScroll: true,
                    above: true,
                    showIfHidden: false
                }));

                var currentBlock = this.widgetManager.addAlignmentBlock();

                td.getProofSteps().forEach(step => {
                    this.processStep(system, step, currentBlock);
                });
            }
        });
    }

    private processStep(system: pr.System, step: pr.ProofStep, currentBlock: EndOfLineWidgetManager.WidgetAlignmentBlock) {
        
        var realStep = system.getStep(step);

        var hypotheses = "";
        if (realStep.getHypotheses().length > 0) {
            hypotheses = "{ " + realStep.getHypotheses().map(h => h.toString({
                forceParenthesis: false,
                parentOperatorPriority: 0,
                useUnicode: true
            })).join(", ") + " } ";
        }
        var text = realStep.getDeductedFormula().toString({
            forceParenthesis: false, parentOperatorPriority: 0, useUnicode: true
        });
        var pos = p.TextRegion.getRegionOf(step);
        var line = pos.getStartLine() - 1;
        var msg = document.createElement("div");

        msg.innerHTML = '<span class="hypotheses">' + hypotheses + "</span>⊢ " + text;
        msg.className = "proof-step-formula";

        var widget = this.widgetManager.addLineWidget(line, msg, currentBlock);
        this.endOfLineWidgets.push(widget);
    }
}


new App();
