 module FirstOrderPredicateLogic.Parser {
     
     export class TermParser {

         public parseTerm(t: Tokenizer, context: IParserContext, logger: ParserLogger): Syntax.Term {
             var start = t.getPosition();
             try {

                 parserHelper.parseWhitespace(t);

                 // e.g. 'y', 'f(x)', 'g(x, h(y))'

                 var identifier = parserHelper.parseIdentifier(t);

                 if (identifier === null) {
                     t.read(); // to prevent endless loops
                     logger.logError("Identifier cannot be empty ", t.getRegion(start));
                     return null;
                 }

                 var funcDecl = context.getFunctionDeclaration(identifier.getIdentifier());

                 var result: Syntax.Term = null;

                 if (funcDecl == null) { // the identifier is a variable or a term

                     var termDecl = context.getTermDeclaration(identifier.getIdentifier());

                     if (termDecl !== null) {
                         result = new Syntax.TermRef(termDecl);
                     } else {
                         var decl = context.getVariableDeclaration(identifier.getIdentifier());
                         result = new Syntax.VariableRef(decl);
                     }

                     if (result !== null) {
                         TextRegion.setRegionTo(result, TextRegion.getRegionOf(identifier));
                         return result;
                     }
                 }


                 parserHelper.parseWhitespace(t);

                 if (!t.tryRead("(")) {
                     //constant
                     return new Syntax.FunctionRef(funcDecl, []);
                 } else {
                     var arguments: Syntax.Term[] = [];
                     var first: boolean = true;

                     parserHelper.parseWhitespace(t);

                     while (!t.tryRead(")") && t.peek() !== "") {

                         if (!first) {
                             //t.tryRead(",");
                             t.read();
                             parserHelper.parseWhitespace(t);
                         }
                         first = false;

                         var term = this.parseTerm(t, context, logger);
                         arguments.push(term);

                         parserHelper.parseWhitespace(t);

                     }

                     return new Syntax.FunctionRef(funcDecl, arguments);
                 }
             } catch (e) {
                 logger.logError("An exception occured: " + e, t.getRegion(start));
                 return null;
             }
         }
     }


 }