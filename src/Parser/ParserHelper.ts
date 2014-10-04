 module FirstOrderPredicateLogic.Parser {


     export class ParserHelperImpl {
         public letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
         public numbers = "0123456789";
         public lettersAndNumbers = this.letters + this.numbers;
         public whitespace = " \r\n\t";

         public parseWhitespace(tokenizer: Tokenizer): string {

             return tokenizer.readWhile(c => this.whitespace.indexOf(c) !== -1);
         }

         public parseIdentifier(tokenizer: Tokenizer): string {

             var p = tokenizer.getPosition();
             var identifier = tokenizer.read();
             if (this.letters.indexOf(identifier) === -1) {
                 tokenizer.gotoPosition(p);
                 return null;
             }

             identifier += tokenizer.readWhile(s => this.lettersAndNumbers.indexOf(s) !== -1);

             return identifier;
         }
     }

     export var parserHelper = new ParserHelperImpl();
 } 