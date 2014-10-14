require.config({
    paths: {
        "text": "../lib/text/index",
        "jquery": "../lib/jquery/index",
        "FirstOrderPredicateLogic": "../dist/FirstOrderPredicateLogic",
        "Codemirror": "../lib/codemirror/codemirror",
        "CodemirrorLint": "http://codemirror.net/addon/lint/lint",
        "JQueryUI": "https://code.jquery.com/ui/1.11.1/jquery-ui.min"
    },

    shim: {
        "FirstOrderPredicateLogic" : {
            exports: "FirstOrderPredicateLogic"
        }
    },
    map: {
        "CodemirrorLint": {
            "../../lib/codemirror": "Codemirror"
        }
    },
});

require(["app", "text!Template_peano.txt", "text!Template_default.txt"], function () { });