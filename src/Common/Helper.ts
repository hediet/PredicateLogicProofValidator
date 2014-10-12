module FirstOrderPredicateLogic.Common {

    export function unique<T, U>(a: T[], selector: (t: T) => U = (i => i)) {
        var prims = { "boolean": {}, "number": {}, "string": {} }, objs: U[] = [];

        return a.filter(item => {
            var i = selector(item);
            var type = typeof i;
            if (type in prims)
                return prims[type].hasOwnProperty(i) ? false : (prims[type][i] = true);
            else
                return objs.indexOf(i) >= 0 ? false : (objs.push(i) >= 0);
        });
    }

    export function firstOrDefault<T, U>(a: T[], defaultElement: U, selector: (t: T) => U): U {

        var result = defaultElement;

        a.some(v => {
            var r = selector(v);
            if (r !== null) {
                result = r;
                return true;
            }
            return false;
        });

        return result;
    }

    export function uniqueJoin<TSource, TResult, TKey>(source: TSource[],
        extractor: (s: TSource) => TResult[], keySelector: (t: TResult) => TKey): TResult[]{

        return source.reduce<TResult[]>((prev, current) => unique(prev.concat(extractor(current)), keySelector), []);
    }
}