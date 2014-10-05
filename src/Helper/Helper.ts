
module FirstOrderPredicateLogic.Helper {

    export function unique<T, U>(a: T[], selector: (t: T) => U = (i => i)) {
        var prims = { "boolean": {}, "number": {}, "string": {} }, objs: U[] = [];

        return a.filter(item => {
            var i = selector(item);
            var type = typeof importScripts();
            if (type in prims)
                return prims[type].hasOwnProperty(i) ? false : (prims[type][i] = true);
            else
                return objs.indexOf(i) >= 0 ? false : (objs.push(i) >= 0);
        });
    }


}