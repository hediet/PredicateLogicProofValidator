 module FirstOrderPredicateLogic.Parser {
     

     export class TermParser {
         
         public parseTerm(t: Tokenizer, context: IParserContext): Syntax.Term {


             parserHelper.parseWhitespace(t);

             // e.g. 'y', 'f(x)', 'g(x, h(y))'

             var identifier = parserHelper.parseIdentifier(t);

             if (identifier === "")
                 t.read();// to prevent endless loops

             var funcDecl = context.getFunctionDeclaration(identifier);

             if (funcDecl == null) { // the identifier is a variable or a term

                 var termDecl = context.getTermDeclaration(identifier);

                 if (termDecl !== null) {
                     return new Syntax.TermRef(termDecl);
                 }

                 var decl = context.getVariableDeclaration(identifier);

                 return new Syntax.VariableRef(decl);
             }



             parserHelper.parseWhitespace(t);

             if (!t.tryRead("(")) {
                 //constant
                 return new Syntax.FunctionRef(funcDecl, []);
             }
             else {
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

                     var term = this.parseTerm(t, context);
                     arguments.push(term);

                     parserHelper.parseWhitespace(t);

                 }

                 return new Syntax.FunctionRef(funcDecl, arguments);
             }
         }
     }


 }