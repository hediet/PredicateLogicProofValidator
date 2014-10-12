require.config({
    paths: {
        "text": "../lib/text/index",
        "jquery": "../lib/jquery/index",
        "FirstOrderPredicateLogic": "../dist/FirstOrderPredicateLogic",
        "Codemirror": "../lib/codemirror/codemirror",
        "CodemirrorLint": "http://codemirror.net/addon/lint/lint"
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

require(["app"], function() {});