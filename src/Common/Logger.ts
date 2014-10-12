module FirstOrderPredicateLogic {

    export class Logger {

        private messages: Message[] = [];

        public logError(text: string, element: any): void {
            this.messages.push(new ErrorMessage(text, element));
        }

        public logWarning(text: string, element: any): void {
            this.messages.push(new WarningMessage(text, element));
        }

        public getMessages(): Message[] {
            return this.messages;
        }
    }


    export class Message {
        constructor(private text: string, private element: any) {

        }

        public getText(): string {
            return this.text;
        }

        public getElement(): any {
            return this.element;
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