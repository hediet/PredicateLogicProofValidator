
///<reference path="../lib/DefinitelyTyped/requirejs/require.d.ts"/>
///<reference path="../lib/DefinitelyTyped/codemirror/codemirror.d.ts"/>
///<reference path="../lib/DefinitelyTyped/jquery/jquery.d.ts"/>
///<reference path="../lib/DefinitelyTyped/jqueryui/jqueryui.d.ts"/>


declare var text: string;

declare module "Codemirror" {
    export = CodeMirror;
}

declare module "FirstOrderPredicateLogic" {
    export = FirstOrderPredicateLogic;
}

declare module "CodemirrorLint" {
    export = text;
}

