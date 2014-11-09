

export class EndOfLineWidget {

    constructor(public node: HTMLElement,
        public lineHandle: CodeMirror.LineHandle,
        public alignmentBlock: WidgetAlignmentBlock) {
    }

    public lastCoords: any;
    public newCoords: any;
}

export class WidgetAlignmentBlock {

    constructor(public id: number) {
    }
}

export class EndOfLineWidgetManager {

    private widgets: EndOfLineWidget[] = [];
    private id = 0;

    constructor(private editor: CodeMirror.Editor) {

        this.editor.on("change", (instance, changeObj) => this.update(changeObj));
    }

    private update(changeObj: { from: CodeMirror.Position; to: CodeMirror.Position} = null) {

        var alignmentBlockWidths: { [id: number]: number } = {};
        
        this.widgets.forEach(w => {
            var info = this.editor.lineInfo(w.lineHandle);
            if (info === null)
                return;

            var line = info.line;
            var column = info.text.length - 1;

            var coords = this.editor.charCoords({ line: line, ch: column }, "local");
            coords.right += 80;
            w.newCoords = coords;

            if (w.alignmentBlock === null)
                return;

            if (typeof alignmentBlockWidths[w.alignmentBlock.id] === "undefined")
                alignmentBlockWidths[w.alignmentBlock.id] = coords.right;
            else
                alignmentBlockWidths[w.alignmentBlock.id] = Math.max(alignmentBlockWidths[w.alignmentBlock.id], coords.right);
        });

        this.widgets.forEach(w => {

            var coords = w.newCoords;


            if (typeof alignmentBlockWidths[w.alignmentBlock.id] !== "undefined")
                coords.right = alignmentBlockWidths[w.alignmentBlock.id];

            if (w.lastCoords != null)
                if (coords.right === w.lastCoords.right && coords.top === w.lastCoords.top)
                    return;

            w.lastCoords = w.newCoords;


            w.node.style.left = coords.right + "px";
            w.node.style.top = coords.top + "px";
        });
    }

    public addAlignmentBlock(): WidgetAlignmentBlock {
        return new WidgetAlignmentBlock(this.id++);
    }

    public addLineWidget(line: number, node: HTMLElement, alignmentBlock: WidgetAlignmentBlock = null): EndOfLineWidget {

        node.style.position = "absolute";

        this.editor.getWrapperElement().appendChild(node);

        var lineHandle = this.editor.getDoc().getLineHandle(line);
        var result = new EndOfLineWidget(node, lineHandle, alignmentBlock);
        this.widgets.push(result);
        this.update();
        return result;
    }

    public removeLineWidget(widget: EndOfLineWidget) {

        var index = this.widgets.indexOf(widget);
        this.widgets.splice(index, 1);

        widget.node.parentNode.removeChild(widget.node);
    }
}
