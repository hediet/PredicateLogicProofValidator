module FirstOrderPredicateLogic.Parser {

    export class ParserLogger {
        
        private messages: Message[] = [];

        public logError(text: string, textRegion: TextRegion): void {
            this.messages.push(new ErrorMessage(text, textRegion));
        }

        public logWarning(text: string, textRegion: TextRegion): void {
            this.messages.push(new WarningMessage(text, textRegion));
        }

        public getMessages(): Message[] {
            return this.messages;
        }
    }

    export class Message {
        constructor(private text: string, private textRegion: TextRegion) {

        }

        public getText(): string {
            return this.text;
        }

        public getTextRegion(): TextRegion {
            return this.textRegion;
        }

        public getSeverity(): string {
            throw "abstract";
        }
    }

    export class ErrorMessage extends Message {
        public getSeverity(): string {
            return "error";
        }
    }

    export class WarningMessage extends Message {
        public getSeverity(): string {
            return "warning";
        }
    } 
} 