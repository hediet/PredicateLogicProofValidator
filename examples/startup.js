require.config({
    paths: {
        "text": "../lib/text/index",
        "jquery": "../lib/jquery/index",
        "FirstOrderPredicateLogic": "../dist/FirstOrderPredicateLogic",
        "Codemirror": "../lib/codemirror/codemirror"
    },

    shim: {
        "FirstOrderPredicateLogic" : {
            exports: "FirstOrderPredicateLogic"
        }
    }
});

require(["app"], function() {});