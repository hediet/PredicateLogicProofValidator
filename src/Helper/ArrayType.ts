module FirstOrderPredicateLogic.Common {

    export class ArrayType {

        private baseType: any;

        constructor(baseType: any) {
            this.baseType = baseType;
        }

        public getItemType() {
            return this.baseType;
        }
    }

}