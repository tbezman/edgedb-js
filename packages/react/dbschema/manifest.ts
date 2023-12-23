import e, { type Cardinality } from "./edgeql-js";
import { $expr_Select, normaliseShape, SelectModifierNames, ComputeSelectCardinality, SelectModifiers, objectTypeToSelectShape } from "./edgeql-js/select";
import { ObjectType, $scopify, ObjectTypeExpression } from "./edgeql-js/typesystem";
import { $linkPropify } from "./edgeql-js/syntax";

type ExprShape<Expr extends ObjectTypeExpression> =
    $scopify<
        Expr["__element__"]
    > &
    $linkPropify<{
        [k in keyof Expr]: k extends "__cardinality__"
        ? typeof Cardinality.One
        : Expr[k];
    }>
    ;

const fragmentMap = new Map<string, ReturnType<typeof e.fragment>>();

export { fragmentMap };
