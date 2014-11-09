
///<reference path="../lib/DefinitelyTyped/requirejs/require.d.ts"/>
///<reference path="../lib/DefinitelyTyped/codemirror/codemirror.d.ts"/>
///<reference path="../lib/DefinitelyTyped/jquery/jquery.d.ts"/>
///<reference path="../lib/DefinitelyTyped/jqueryui/jqueryui.d.ts"/>
///<reference path="../lib/DefinitelyTyped/hashmap/hashmap.d.ts"/>

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

declare module "CodemirrorSimple" {
    export = text;
}

declare module "JQueryUI" {
    export = $;
}

declare module "HashMap" {
    export = HashMap;
}

declare module CodeMirror {

    interface Regex {
        regex: RegExp;
        token?: any;
        next?: string;
        indent?: boolean;
        dedent?: boolean;
        mode?: any;

    }

    function defineSimpleMode(name: string, states: {
        start: Regex[];
        meta?: any;
        [id: string]: Regex[];
    });
}
