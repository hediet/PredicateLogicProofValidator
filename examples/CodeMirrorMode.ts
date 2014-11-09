
import CodeMirrorSimple = require("CodemirrorSimple");
import CodeMirror = require("Codemirror");

var c = [CodeMirrorSimple];

export class CodeMirrorMode {
    public static install() {
        CodeMirror.defineSimpleMode("proof", {
            start: [
                {
                    regex: /(?:Let|be|forall)\b/,
                    token: "keyword"
                },
                { regex: /(Axiom|Rule|Theorem|GlobalSymbols)(\s+)([a-zA-Z0-9]+)/, token: ["header", null, "string"] },
                { regex: /(GlobalSymbols)/, token: "header" },
                { regex: /(#)(\s+)([a-zA-Z0-9]*\.)(\s+)([a-zA-Z0-9]*)/, token: [null, null, "number", null, "string"] },
                { regex: /@[a-zA-Z0-9]*/, token: "number" },
                { regex: /(Symbols|Assertion|Proof|Conditions|Assumptions|Conclusion):/, token: "attribute" },
                { regex: /\/\/.*/, token: "comment" },
                { regex: /[-<>|&]+/, token: "operator" },

                // indent and dedent properties guide autoindentation
                { regex: /[\{\[\(]/, indent: true },
                { regex: /[\}\]\)]/, dedent: true }
            ],

            meta: <any>{
                dontIndentStates: ["comment", "start"],
                lineComment: "//"
            }
        });
    }
} 