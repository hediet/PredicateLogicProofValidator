
///<reference path="definitions.d.ts"/>


import defaultText = require("text!default.txt");
import $ = require("jquery");
import CodeMirror = require("Codemirror");
import CodeMirrorLint = require("CodemirrorLint");
import FirstOrderPredicateLogic = require("FirstOrderPredicateLogic");

import s = FirstOrderPredicateLogic.Syntax;
import p = FirstOrderPredicateLogic.Parser;
import pr = FirstOrderPredicateLogic.Proof;

import EndOfLineWidgetManager = require("EndOfLineWidgetManager");

var cl = CodeMirrorLint; // to force typescript to generate the require statement

class CodeMirrorLintElement {
    public from: CodeMirror.Position;
    public to: CodeMirror.Position;


    constructor(region: p.TextRegion, public message: string, public severity: string) {
        this.from = {
            line: region.getStartLine(),
            ch: region.getStartColumn()
        };
        this.to = {
            line: region.getEndLine(),
            ch: region.getEndColumn()
        };
    }
}

class App {

    private editor: CodeMirror.Editor;
    private widgetManager: EndOfLineWidgetManager.EndOfLineWidgetManager;
    private endOfLineWidgets: EndOfLineWidgetManager.EndOfLineWidget[] = [];
    private lineWidgets: CodeMirror.LineWidget[] = [];
    private documentParser: p.DocumentParser;
    private currentLintElements: CodeMirrorLintElement[] = [];

    constructor() {

        $("#code").text(defaultText);

        var termParser = new p.TermParser();
        var formulaParser = new p.FormulaParser(termParser, s.Operation.getAvailableOperations());

        this.documentParser = new p.DocumentParser(formulaParser, termParser, pr.Condition.getAvailableConditions());

        this.editor = CodeMirror.fromTextArea(<HTMLTextAreaElement>document.getElementById("code"), {
            lineNumbers: true,
            styleActiveLine: true,
            matchBrackets: true,
            viewportMargin: Infinity,
            gutters: ["CodeMirror-lint-markers"],
            lint: () => this.currentLintElements
        });

        this.widgetManager = new EndOfLineWidgetManager.EndOfLineWidgetManager(this.editor);

        setTimeout(() => this.editorChanged(), 10);

        var waiting;
        this.editor.on("change", () => {
            clearTimeout(waiting);
            waiting = setTimeout(() => this.editor.operation(() => this.editorChanged()), 400);
        });
    }


    private editorChanged() {

        for (var i = 0; i < this.endOfLineWidgets.length; ++i)
            this.widgetManager.removeLineWidget(this.endOfLineWidgets[i]);

        for (var i = 0; i < this.lineWidgets.length; ++i)
            this.lineWidgets[i].clear();

        this.endOfLineWidgets.length = 0;
        this.lineWidgets.length = 0;

        var textRegionLogger = new p.ParserLogger();

        var result = this.documentParser.parseStr(this.editor.getDoc().getValue(), textRegionLogger);

        var logger = new FirstOrderPredicateLogic.Logger();


        var system = new pr.System(result, logger);

        result.getDescriptions().forEach(d => {

            if (d instanceof pr.TheoremDescription) {
                var td = <pr.TheoremDescription>d;

                this.processTheoremDescription(system, td);
            }
        });


        this.currentLintElements.length = 0;
        textRegionLogger.getMessages().forEach(msg => {
            this.currentLintElements.push(new CodeMirrorLintElement(msg.getTextRegion(), msg.getText(), msg.getSeverity()));
        });

        logger.getMessages().forEach(msg => {

            var region: p.TextRegion;

            if (p.TextRegion.hasRegion(msg.getElement())) {
                region = p.TextRegion.getRegionOf(msg.getElement());
            } else
                region = new p.TextRegion(1, 1, 1, 1);

            this.currentLintElements.push(new CodeMirrorLintElement(region, msg.getText(), msg.getSeverity()));
        });

    }

    private processTheoremDescription(system: pr.System, theorem: pr.TheoremDescription) {
        var text = "";
        if (system.getIsProven(theorem)) {
            status = "proof-status-proven";
            text = "This theorem is proved";
        } else {
            status = "proof-status-invalid";
            text = "This theorem is not proved";
        }

        var pos = p.TextRegion.getRegionOf(theorem);
        var line = pos.getStartLine();
        var msg = document.createElement("div");
        msg.innerHTML = text;
        msg.className = "proof-status " + status;
        this.lineWidgets.push(this.editor.addLineWidget(line, msg, {
            coverGutter: false,
            noHScroll: true,
            above: true,
            showIfHidden: false
        }));

        var currentBlock = this.widgetManager.addAlignmentBlock();

        theorem.getProofSteps().forEach(step => {
                this.processStep(system, step, currentBlock);
        });
    }

    private processStep(system: pr.System, step: pr.ProofStep, currentBlock: EndOfLineWidgetManager.WidgetAlignmentBlock) {

        var realStep = system.getStep(step);

        if (realStep === null)
            return;

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
        var line = pos.getStartLine();
        var msg = document.createElement("div");

        msg.innerHTML = '<span class="hypotheses">' + hypotheses + "</span>⊢ " + text;
        msg.className = "proof-step-formula";

        var widget = this.widgetManager.addLineWidget(line, msg, currentBlock);
        this.endOfLineWidgets.push(widget);
    }
}


new App();
