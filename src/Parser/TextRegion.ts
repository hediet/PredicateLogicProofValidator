module FirstOrderPredicateLogic.Parser {

    export class TextPoint {
        constructor(private line: number, private column: number) {

        }

        public getLine() {
            return this.line;
        }

        public getColumn() {
            return this.column;
        }
    }

    export class TextRegion {

        public static hasRegion(node: any): boolean {
            return typeof node.getTextRegion === "function";
        }

        public static getRegionOf(node: any): TextRegion {
            if (!TextRegion.hasRegion(node))
                throw new Error("node has no text region!");
            return node.getTextRegion();
        }

        private static getTextRegionFunc = null;

        public static setRegionTo(node: any, region: TextRegion) {

            if (this.getTextRegionFunc === null)
                this.getTextRegionFunc = function () { return (<any>this)._TextRegion_region; };

            node._TextRegion_region = region;
            node.getTextRegion = this.getTextRegionFunc;
        }

        constructor(private startLine: number, private startColumn: number,
            private endLine: number, private endColumn: number) {

        }

        public getStartLine() {
            return this.startLine;
        }

        public getStartColumn() {
            return this.startColumn;
        }

        public getEndLine() {
            return this.endLine;
        }

        public getEndColumn() {
            return this.endColumn;
        }

        public toString() {
            return this.getStartLine() + ": " + this.getStartColumn() +
                " - " + this.getEndLine() + ": " + this.getEndColumn();
        }

        public toJson() {
            return {
                startLine: this.startLine,
                startColumn: this.startColumn,
                endLine: this.endLine,
                endColumn: this.endColumn
            };
        }

        public contains(p: TextPoint): boolean {
            if (this.startLine == p.getLine() && this.startColumn > p.getColumn())
                return false;
            if (this.endLine == p.getLine() && this.endColumn < p.getColumn())
                return false;

            return (this.startLine <= p.getLine()) && (p.getLine() <= this.endLine);
        }
    }
}