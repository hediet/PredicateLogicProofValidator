module FirstOrderPredicateLogic.Helper {
    export class ArgumentExceptionHelper {
        
        public static ensureUndefinedOrTypeOf(obj: any, type: any, name: string) {
            if (typeof obj === "undefined")
                return;
            ArgumentExceptionHelper.ensureTypeOf(obj, type, name);
        }

        public static ensureNullOrTypeOf(obj: any, type: any, name: string) {
            if (obj === null)
                return;
            ArgumentExceptionHelper.ensureTypeOf(obj, type, name);
        }

        public static ensureTypeOf(obj: any, type: any, name: string) {
            if (type === "string") {
                if (typeof (obj) !== "string") {
                    throw new Error("Argument '" + name + "' must be of type string.");
                }
            } else {
                if (obj === null) {
                    throw new Error("Argument '" + name + "' is null, must be of type " + type.toString() + ".");
                }
                if (!(obj instanceof type)) {
                    var funcNameRegex = /function (.{1,})\(/;
                    var results = funcNameRegex.exec(type.toString());
                    var typeName = (results && results.length > 1) ? results[1] : "";

                    throw new Error("Argument '" + name + "' must be of type " + typeName + ", but was " + obj + ".");
                }
            }
        }

        public static ensureArrayTypeOf(object: any[], elementType: any, name: string) {
            for (var i = 0; i < object.length; i++) {
                this.ensureTypeOf(object[i], elementType, name + "[" + i + "]");
            }
        }
    }
}
