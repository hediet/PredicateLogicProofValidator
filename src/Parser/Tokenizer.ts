module FirstOrderPredicateLogic.Parser {

    export class Tokenizer {

        private text: string;
        private currentPosition: number = 0;

        private currentLine: number = 0;
        private currentColumn: number = 0;

        constructor(text: string) {
            this.text = text;
        }

        /**
         * Tries to read text. If successful, true will be returned.
         * If not successful, the position will be resetted to the state
         * before the method call and false will be returned
         */
        public tryRead(expectedText: string, consume: boolean = true): boolean {
            var pos = this.getPosition();

            for (var i = 0; i < expectedText.length; i++) {
                if (this.read() !== expectedText.charAt(i)) {
                    this.gotoPosition(pos);
                    return false;
                }
            }

            if (!consume)
                this.gotoPosition(pos);

            return true;
        }

        /**
         * Returns the next character. 
         * An empty string will be returned if there is no next character.
         */
        public peek(): string {
            if (this.currentPosition >= this.text.length)
                return "";
            return this.text.charAt(this.currentPosition);
        }

        public read(): string {
            if (this.currentPosition >= this.text.length)
                return "";
            var result = this.text.charAt(this.currentPosition);

            this.currentPosition++;

            if (result === "\n") {
                this.currentLine++;
                this.currentColumn = 0;
            }
            else {
                this.currentColumn++;
            }

            return result;
        }


        public getPosition(): any {
            return { position: this.currentPosition, column: this.currentColumn, line: this.currentLine };
        }

        public gotoPosition(position: any) {
            this.currentPosition = position.position;
            this.currentColumn = position.column;
            this.currentLine = position.line;
        }

        public readWhile(condition: (c: string) => boolean): string {
            var chars = "";
            while (true) {
                var nextChar = this.peek();
                if (nextChar === "" || !condition(nextChar))
                    break;
                this.read();
                chars += nextChar;
            }

            return chars;
        }

        public getRegion(startPos: any): TextRegion {
            return new TextRegion(startPos.line, startPos.column,
                this.currentLine, this.currentColumn);
        }
    }
}