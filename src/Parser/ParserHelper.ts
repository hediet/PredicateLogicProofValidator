 module FirstOrderPredicateLogic.Parser {


     export class ParserHelperImpl {
         public letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
         public numbers = "0123456789";
         public lettersAndNumbers = this.letters + this.numbers;
         public whitespace = " \r\n\t";

         public parseWhitespace(tokenizer: Tokenizer): string {

                 return tokenizer.readWhile(c => {
                     if (tokenizer.tryRead("//")) {
                         tokenizer.readWhile(c => c !== "\n");
                         return true;
                     }
                     return this.whitespace.indexOf(c) !== -1;
                 });
         }

         public parseIdentifier(tokenizer: Tokenizer, restrictFirstLetter: boolean = true): Proof.IdentifierElement {

             var firstLetters = restrictFirstLetter ? this.letters : this.lettersAndNumbers;

             var p = tokenizer.getPosition();
             var identifier = tokenizer.read();
             if (firstLetters.indexOf(identifier) === -1) {
                 tokenizer.gotoPosition(p);
                 return null;
             }

             identifier += tokenizer.readWhile(s => this.lettersAndNumbers.indexOf(s) !== -1);

             var identifierElement = new Proof.IdentifierElement(identifier);
             TextRegion.setRegionTo(identifierElement, tokenizer.getRegion(p));
             return identifierElement;
         }
     }

     export var parserHelper = new ParserHelperImpl();
 } 