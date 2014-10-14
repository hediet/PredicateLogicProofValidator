
///<reference path="definitions.d.ts"/>


function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

var template = getParameterByName("template");
if (!template)
    template = "default";

var defaultText = require("text!Template_" + template + ".txt");
import $ = require("jquery");
import jQueryUi = require("JQueryUI");
import CodeMirror = require("Codemirror");
import CodeMirrorLint = require("CodemirrorLint");
import FirstOrderPredicateLogic = require("FirstOrderPredicateLogic");

import s = FirstOrderPredicateLogic.Syntax;
import p = FirstOrderPredicateLogic.Parser;
import pr = FirstOrderPredicateLogic.Proof;
import common = FirstOrderPredicateLogic.Common;

import EndOfLineWidgetManager = require("EndOfLineWidgetManager");

var cl = CodeMirrorLint; // to force typescript to generate the require statement
var jQueryUiInstance = jQueryUi;

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


class HypothesisRemover {
    
    constructor(private ax1: pr.Axiom, private ax2: pr.Axiom, private ruleMp: pr.Rule, private tImpSym: pr.Theorem) {
        
    }

    public removeHypothesis(step: pr.Step, hypothesis: s.Formula, context: s.ConditionContext): pr.Step {

        if (step instanceof pr.ProofableFormulaBuilderStep) {
            var p = <pr.ProofableFormulaBuilderStep>step;

            if (p.getProofableFormulaBuilder() instanceof pr.HypothesisAxiom) {
                var h = (<s.FormulaSubstitution>p.getArguments()[0]).getElementToInsert();

                if (hypothesis.equals(h)) {
                    return new pr.ProofableFormulaBuilderStep(this.tImpSym,
                        s.Substitution.fromValues(this.tImpSym.getParameters(), [h, h]), context);
                }
            }

            var s1 = new pr.ProofableFormulaBuilderStep(this.ax1,
                s.Substitution.fromValues(this.ax1.getParameters(), [p.getDeductedFormula(), hypothesis]), context);

            var s2 = new pr.RuleStep(this.ruleMp, [p, s1], [], context);

            return s2;
        }
        else if (step instanceof pr.RuleStep) {
            var r = <pr.RuleStep>step;

            if (r.getRule() === this.ruleMp) {

                var premise = r.getAssumptions()[0];
                var implication = r.getAssumptions()[1];
                var newPremise = this.removeHypothesis(premise, hypothesis, context);
                var newImplication = this.removeHypothesis(implication, hypothesis, context);

                var impl = <s.Implication>implication.getDeductedFormula();

                var s1 = new pr.ProofableFormulaBuilderStep(this.ax2,
                    s.Substitution.fromValues(this.ax2.getParameters(),
                        [hypothesis, premise.getDeductedFormula(), impl.getArguments()[1]]), context);
                var s2 = new pr.RuleStep(this.ruleMp, [newImplication, s1], [], context);
                var s3 = new pr.RuleStep(this.ruleMp, [newPremise, s2], [], context);

                return s3;
            } else if (r.getRule() instanceof pr.DeductionRule) {
                
                var assumption = r.getAssumptions()[0];
                var subHypothesis = (<s.FormulaSubstitution>r.getArguments()[1]).getElementToInsert();

                var s4 = this.removeHypothesis(assumption, subHypothesis, context);
                return this.removeHypothesis(s4, hypothesis, context);
            }

            throw "Rule " + r.getRule().getName() + " is not supported.";
        }

        return step;
    }

    public removeAllHypotheses(step: pr.Step, context: s.ConditionContext): pr.Step {

        if (step instanceof pr.ProofableFormulaBuilderStep) {
            return step;
        }
        else if (step instanceof pr.RuleStep) {
            var r = <pr.RuleStep>step;

            if (r.getRule() instanceof pr.DeductionRule) {

                var assumption = r.getAssumptions()[0];
                var hypothesis = (<s.FormulaSubstitution>r.getArguments()[1]).getElementToInsert();
                var newStep = this.removeHypothesis(assumption, hypothesis, context);

                return newStep;
            }

            return null; //todo
        }

        return step;
    }
}

class App {

    private editor: CodeMirror.Editor;
    private widgetManager: EndOfLineWidgetManager.EndOfLineWidgetManager;
    private endOfLineWidgets: EndOfLineWidgetManager.EndOfLineWidget[] = [];
    private lineWidgets: CodeMirror.LineWidget[] = [];
    private documentParser: p.DocumentParser;
    private currentLintElements: CodeMirrorLintElement[] = [];
    private lastSystem: pr.System;
    private lastDocument: pr.Document;

    private dialog: jQueryUi.JQuery;

    constructor() {

        $("#code").text(defaultText);

        var termParser = new p.TermParser();
        var formulaParser = new p.FormulaParser(termParser, s.Operation.getAvailableOperations());

        this.documentParser = new p.DocumentParser(formulaParser, termParser, pr.Condition.getAvailableConditions());

        var dialog = (<jQueryUi.JQuery><any>$("#dialog-message")).dialog({
            width: 1000,
            height: 500,
            autoOpen: false,
            modal: true,
            buttons: {
                Ok: function() {
                    (<jQueryUi.JQuery><any>$(this)).dialog("close");
                }
            }
        });
    

        this.dialog = dialog;

        
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

        this.editor.addKeyMap({
            "Ctrl-Q": (cm: CodeMirror.Editor) => {
                console.log("pressed");

                if (this.lastDocument == null || this.lastSystem == null)
                    return;

                var step = this.getStepAtCursor();
                if (step == null)
                    return;

                var realStep = this.lastSystem.getStep(step);
                var r = (name: string) => this.lastSystem.getFormulaBuilderByName(name);
                var remover = new HypothesisRemover(<pr.Axiom>r("A1"), <pr.Axiom>r("A2"), <pr.Rule>r("MP"), <pr.Theorem>r("T1"));

                realStep = remover.removeAllHypotheses(realStep, realStep.getContext());
                this.showStepWithoutDeductionTheorem(realStep);
            }
        });
    }

    private getStepAtCursor(): pr.DocumentStep {
        var c = this.editor.getDoc().getCursor();
        var point = new p.TextPoint(c.line, c.ch);

        return common.firstOrDefault(this.lastDocument.getDescriptions(), null, d => {

            if (p.TextRegion.getRegionOf(d).contains(point)) {

                if (d instanceof pr.TheoremDescription) {
                    var td = <pr.TheoremDescription>d;
                    return common.firstOrDefault(td.getProofSteps(), null, step => {

                        if (p.TextRegion.getRegionOf(step).contains(point)) {
                            return step;
                        }

                        return null;
                    });
                }
            }

            return null;
        });
    }


    private renderStep(step: pr.Step, proof: string[]): number {
        
        if (step instanceof pr.RuleStep) {
            var ruleStep = <pr.RuleStep>step;

            var assumptions = ruleStep.getAssumptions().map(a => this.renderStep(a, proof));

            var args: s.Substitution[] = [];

            ruleStep.getRule().getNecessaryParameters().forEach(param => {
                var arg = common.firstOrDefault(ruleStep.getArguments(), null,
                    a => a.getDeclarationToSubstitute().equals(param) ? a : null);
                args.push(arg);
            });

            var stepId = proof.length;

            var elements = assumptions.map(a => "@" + a).concat(args.map(a => a.getElementToInsert().toString()));

            var stepStr = " # " + stepId + ". " + ruleStep.getRule().getName() + "(" + elements.join(", ") + ")";
            proof.push(stepStr);
            return stepId;
        }
        else if (step instanceof pr.ProofableFormulaBuilderStep) {
            var pStep = <pr.ProofableFormulaBuilderStep>step;

            var stepId = proof.length;

            var stepStr = " # " + stepId + ". " + pStep.getProofableFormulaBuilder().getName() + "("
                + pStep.getArguments().map(a => a.getElementToInsert().toString()).join(", ") + ")";
            proof.push(stepStr);
            return stepId;
        }
        throw "Unsupported step";
    }


    private showStepWithoutDeductionTheorem(step: pr.Step) {
        this.dialog.dialog("open");

        var proof: string[] = [];

        this.renderStep(step, proof);


        var str = proof.join("\n");

        $("#dialog-code").val(str);
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
        this.lastDocument = result;

        var logger = new FirstOrderPredicateLogic.Logger();


        var system = new pr.System(result, logger);
        this.lastSystem = system;

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

    private processStep(system: pr.System, step: pr.DocumentStep, currentBlock: EndOfLineWidgetManager.WidgetAlignmentBlock) {

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
