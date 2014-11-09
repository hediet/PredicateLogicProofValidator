require.config({
    paths: {
        "jquery": "../lib/jquery/index",
        "FirstOrderPredicateLogic": "../dist/FirstOrderPredicateLogic",
        "Codemirror": "../lib/codemirror/codemirror",
        "CodemirrorLint": "../lib/codemirror-lint/index",
        "CodemirrorSimple": "../lib/codemirror-simple/index",
        "JQueryUI": "../lib/jqueryui/index",
        "HashMap": "../lib/hashmap/hashmap"
    },
    shim: {
        "FirstOrderPredicateLogic": {
            deps: ['HashMap'],
            exports: "FirstOrderPredicateLogic",
            init: function() {
                window.HashMap = require("HashMap");
            }
        }
    },
    map: {
        "CodemirrorLint": {
            "../../lib/codemirror": "Codemirror"
        },
        "CodemirrorSimple": {
            "../../lib/codemirror": "Codemirror"
        }
    }
});

require(["app"], function () { });