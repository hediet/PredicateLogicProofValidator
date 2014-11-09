
///<reference path="definitions.d.ts"/>

import $ = require("jquery");
import jQueryUi = require("JQueryUI");
import CodeMirror = require("Codemirror");
import CodeMirrorLint = require("CodemirrorLint");
import CodeMirrorSimple = require("CodemirrorSimple");
import FirstOrderPredicateLogic = require("FirstOrderPredicateLogic");
import EndOfLineWidgetManagerModule = require("EndOfLineWidgetManager");
import HashMap = require("HashMap");
import CodeMirrorMode = require("CodeMirrorMode");


// to force typescript to generate the require statement
var d = [CodeMirrorLint, CodeMirrorSimple, jQueryUi ]; 

module App {

    import HypothesisRemover = FirstOrderPredicateLogic.Proof.HypothesisRemover;
    import FormulaParser = FirstOrderPredicateLogic.Parser.FormulaParser;
    import TermParser = FirstOrderPredicateLogic.Parser.TermParser;
    import DocumentParser = FirstOrderPredicateLogic.Parser.DocumentParser;
    import Condition = FirstOrderPredicateLogic.Proof.Condition;
    import DocumentStep = FirstOrderPredicateLogic.Proof.DocumentStep;
    import TheoremDescription = FirstOrderPredicateLogic.Proof.TheoremDescription;
    import Step = FirstOrderPredicateLogic.Proof.Step;
    import RuleStep = FirstOrderPredicateLogic.Proof.RuleStep;
    import ProofableFormulaBuilderStep = FirstOrderPredicateLogic.Proof.ProofableFormulaBuilderStep;
    import TextRegion = FirstOrderPredicateLogic.Parser.TextRegion;
    import ProofValidation = FirstOrderPredicateLogic.Proof.ProofValidation;
    import Operation = FirstOrderPredicateLogic.Syntax.Operation;
    import TextPoint = FirstOrderPredicateLogic.Parser.TextPoint;
    import Common = FirstOrderPredicateLogic.Common;
    import Substitution = FirstOrderPredicateLogic.Syntax.Substitution;
    import Rule = FirstOrderPredicateLogic.Proof.Rule;
    import ParserLogger = FirstOrderPredicateLogic.Parser.ParserLogger;
    import EndOfLineWidgetManager = EndOfLineWidgetManagerModule.EndOfLineWidgetManager;
    import EndOfLineWidget = EndOfLineWidgetManagerModule.EndOfLineWidget;
    import WidgetAlignmentBlock = EndOfLineWidgetManagerModule.WidgetAlignmentBlock;

    class CodeMirrorLintElement {
        public from: CodeMirror.Position;
        public to: CodeMirror.Position;


        constructor(region: TextRegion, public message: string, public severity: string) {
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

    export class App {

        private editor: CodeMirror.Editor;
        private widgetManager: EndOfLineWidgetManager;
        private endOfLineWidgets: EndOfLineWidget[] = [];
        private lineWidgets: CodeMirror.LineWidget[] = [];
        private documentParser: DocumentParser;
        private currentLintElements: CodeMirrorLintElement[] = [];
        private lastSystem: ProofValidation;
        private lastDocument: FirstOrderPredicateLogic.Proof.Document;

        private dialog: JQuery;

        constructor() {

            var termParser = new TermParser();
            var formulaParser = new FormulaParser(termParser, Operation.getAvailableOperations());

            this.documentParser = new DocumentParser(formulaParser, termParser, Condition.getAvailableConditions());

            this.dialog = ($("#dialog-message")).dialog({
                width: 1000,
                height: 500,
                autoOpen: false,
                modal: true,
                buttons: {
                    Ok() {
                        $(this).dialog("close");
                    }
                }
            });

            CodeMirrorMode.CodeMirrorMode.install();


            this.editor = CodeMirror.fromTextArea(<HTMLTextAreaElement>$("#code").get(0), {
                mode: "proof",
                lineNumbers: true,
                styleActiveLine: true,
                matchBrackets: true,
                viewportMargin: Infinity,
                gutters: ["CodeMirror-lint-markers"],
                lint: {
                    delay: 650,
                    getAnnotations: () => this.currentLintElements
                }
            });

            this.widgetManager = new EndOfLineWidgetManager(this.editor);


            var waiting;
            this.editor.on("change", () => {
                clearTimeout(waiting);
                waiting = setTimeout(() => this.editor.operation(() => this.editorChanged()), 600);
            });



            this.editor.addKeyMap({
                "Ctrl-Q": (cm: CodeMirror.Editor) => this.showStepWithoutDeductionTheorem()
            });


            var template = this.getParameterByName("template");
            if (!template)
                template = "default";

            var templateFile = "Template_" + template + ".txt";

            $.get(templateFile, data => {
                this.editor.getDoc().setValue(data);
            });
        }

        private getParameterByName(name: string): string {
            name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
            var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
                results = regex.exec(location.search);
            return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
        }



        private getStepAtCursor(): DocumentStep {
            var c = this.editor.getDoc().getCursor();
            var point = new TextPoint(c.line, c.ch);

            return Common.firstOrDefault(this.lastDocument.getDescriptions(), null, d => {

                if (TextRegion.getRegionOf(d).contains(point)) {

                    if (d instanceof TheoremDescription) {
                        var td = <TheoremDescription>d;
                        return Common.firstOrDefault(td.getProofSteps(), null, step => {

                            if (TextRegion.getRegionOf(step).contains(point)) {
                                return step;
                            }

                            return null;
                        });
                    }
                }

                return null;
            });
        }


        private renderStep(step: Step, proof: string[], hashmap: HashMap<Step, number>): number {

            if (hashmap.has(step)) {
                return hashmap.get(step);
            }

            if (step instanceof RuleStep) {
                var ruleStep = <RuleStep>step;

                var assumptionIds = ruleStep.getAssumptions().map(a => this.renderStep(a, proof, hashmap));

                var args: Substitution[] = [];

                ruleStep.getRule().getNecessaryParameters().forEach(param => {
                    var arg = Common.firstOrDefault(ruleStep.getArguments(), null,
                        a => a.getDeclarationToSubstitute().equals(param) ? a : null);
                    args.push(arg);
                });

                var stepId = proof.length;

                var elements = assumptionIds.map(id => "@" + id).concat(args.map(a => a.getElementToInsert().toString()));

                var stepStr = " # " + stepId + ". " + ruleStep.getRule().getName() + "(" + elements.join(", ") + ")";
                proof.push(stepStr);
                hashmap.set(step, stepId);
                return stepId;
            }
            else if (step instanceof ProofableFormulaBuilderStep) {
                var pStep = <ProofableFormulaBuilderStep>step;

                var stepId = proof.length;

                var stepStr = " # " + stepId + ". " + pStep.getProofableFormulaBuilder().getName() + "("
                    + pStep.getArguments().map(a => a.getElementToInsert().toString()).join(", ") + ")";
                proof.push(stepStr);
                return stepId;
            }
            throw "Unsupported step";
        }


        private showStepWithoutDeductionTheorem() {
            if (this.lastDocument == null || this.lastSystem == null)
                return;

            var step = this.getStepAtCursor();
            if (step == null)
                return;

            var realStep = this.lastSystem.getStep(step);
            var r = (name: string) => this.lastSystem.getFormulaBuilderByName(name);
            var remover = new HypothesisRemover(r("A1"), r("A2"), <Rule>r("MP"), r("T1"));

            realStep = remover.removeAllHypotheses(realStep, realStep.getContext());

            var proof: string[] = [];

            this.renderStep(realStep, proof, new HashMap<Step, number>());

            var str = proof.join("\n");

            this.dialog.dialog("open")
                .find("#dialog-code").val(str);
        }

        private editorChanged() {

            for (var i = 0; i < this.endOfLineWidgets.length; ++i)
                this.widgetManager.removeLineWidget(this.endOfLineWidgets[i]);

            this.endOfLineWidgets.length = 0;

            for (var i = 0; i < this.lineWidgets.length; ++i)
                this.lineWidgets[i].clear();
            this.lineWidgets.length = 0;


            var textRegionLogger = new ParserLogger();
            var result = this.documentParser.parseStr(this.editor.getDoc().getValue(), textRegionLogger);
            this.lastDocument = result;

            var logger = new FirstOrderPredicateLogic.Logger();


            var system = new ProofValidation(result, logger);
            this.lastSystem = system;

            result.getDescriptions().forEach(d => {

                if (d instanceof TheoremDescription) {
                    var td = <TheoremDescription>d;

                    this.processTheoremDescription(system, td);
                }
            });


            this.currentLintElements.length = 0;
            textRegionLogger.getMessages().forEach(msg => {
                this.currentLintElements.push(new CodeMirrorLintElement(msg.getTextRegion(), msg.getText(), msg.getSeverity()));
            });

            logger.getMessages().forEach(msg => {

                var region: TextRegion;

                if (TextRegion.hasRegion(msg.getElement())) {
                    region = TextRegion.getRegionOf(msg.getElement());
                } else
                    region = new TextRegion(1, 1, 1, 1);

                this.currentLintElements.push(new CodeMirrorLintElement(region, msg.getText(), msg.getSeverity()));
            });

        }

        private processTheoremDescription(system: ProofValidation, theorem: TheoremDescription) {
            var text: string;
            var status: string;
            if (system.getIsProven(theorem)) {
                status = "proof-status-proven";
                text = "This theorem is proved";
            } else {
                status = "proof-status-invalid";
                text = "This theorem is not proved";
            }

            var pos = TextRegion.getRegionOf(theorem);
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

            theorem.getProofSteps().forEach(step => this.processProofStep(system, step, currentBlock));
        }

        private processProofStep(system: ProofValidation, step: DocumentStep, currentBlock: WidgetAlignmentBlock) {

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
            var pos = TextRegion.getRegionOf(step);
            var line = pos.getStartLine();
            var msg = document.createElement("div");

            msg.innerHTML = '<span class="hypotheses">' + hypotheses + "</span>⊢ " + text;
            msg.className = "proof-step-formula";

            var widget = this.widgetManager.addLineWidget(line, msg, currentBlock);
            this.endOfLineWidgets.push(widget);
        }
    }
}



new App.App();
