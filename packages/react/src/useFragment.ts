import React from "react";
import { EdgeDBContext } from "./EdgeDBProvider";
import rfdc from "rfdc";
import { findType, readFromCache, updateCache } from "./cache";
import equal from "fast-deep-equal";

// Strictly importing the type here
import type {
  ObjectTypeExpression,
  TypeSet,
} from "../../generate/src/syntax/typesystem";
import type {
  FragmentPullReturnType,
  FragmentReturnType,
  ShapeExtends,
  QueryFragmentReturnType,
  ScopeParam,
  QueryFragmentPullReturnType,
} from "nextjs-demo/dbschema/edgeql-js/select";

const clone = rfdc();

export function useFragment<
  Ref,
  Shape extends ShapeExtends<Expr>,
  Expr extends ObjectTypeExpression
>(
  ref: Ref,
  expr: Expr,
  shape: (scope: ScopeParam<Expr>) => Readonly<Shape>
): FragmentPullReturnType<Expr, Shape>;

export function useFragment<
  FN extends string,
  F extends FragmentReturnType<
    FN,
    ObjectTypeExpression,
    ShapeExtends<ObjectTypeExpression>
  >
>(
  ref: Array<Parameters<F["pull"]>[0]>,
  fragment: F
): Array<ReturnType<F["pull"]>>;
export function useFragment<
  FN extends string,
  F extends FragmentReturnType<
    FN,
    ObjectTypeExpression,
    ShapeExtends<ObjectTypeExpression>
  >
>(ref: Parameters<F["pull"]>[0], fragment: F): ReturnType<F["pull"]>;
export function useFragment<
  FN extends string,
  F extends FragmentReturnType<
    FN,
    ObjectTypeExpression,
    ShapeExtends<ObjectTypeExpression>
  >
>(
  ref: Parameters<F["pull"]>[0] | null,
  fragment: F
): ReturnType<F["pull"]> | null;
export function useFragment<
  FN extends string,
  F extends FragmentReturnType<
    FN,
    ObjectTypeExpression,
    ShapeExtends<ObjectTypeExpression>
  >
>(
  ref: Array<Parameters<F["pull"]>[0]> | Parameters<F["pull"]>[0] | null,
  fragment: F
): Array<ReturnType<F["pull"]>> | ReturnType<F["pull"]> | null {
  let data: Array<ReturnType<F["pull"]>> | ReturnType<F["pull"]> | null = null;
  if (Array.isArray(ref)) {
    data = ref.map(fragment.pull) as Array<ReturnType<F["pull"]>>;
  } else if (ref) {
    data = fragment.pull(ref) as ReturnType<F["pull"]>;
  }

  if (typeof window === "undefined") {
    return data;
  }

  const context = React.useContext(EdgeDBContext);
  const setCache = context?.setCache;
  if (!context) {
    throw new Error(`useFragment must be used within an EdgeDBProvider`);
  }
  const type = findType(context.spec, fragment.type_);
  if (!type) {
    throw new Error(`Could not find type ${fragment.type_}`);
  }

  React.useEffect(() => {
    if (!data) {
      return;
    }

    setCache?.((previous) => {
      const cache = clone(previous);

      updateCache({
        spec: context?.spec,
        cache,

        data: data as any,
        type,
      });

      if (equal(previous, cache)) {
        return previous;
      }

      return cache;
    });
  }, [ref]);

  if (!data) {
    return null;
  }

  let resultFromCache:
    | Array<ReturnType<F["pull"]>>
    | ReturnType<F["pull"]>
    | null = null;

  if (Array.isArray(data)) {
    resultFromCache = data.map((item) => {
      return (
        (readFromCache({
          type,
          spec: context.spec,
          fragmentMap: context.fragmentMap,
          cache: context?.cache ?? {},
          shape: fragment.shape()({}),
          id: item.id as string,
        }) as ReturnType<F["pull"]>) ?? item
      );
    });
  } else {
    resultFromCache =
      (readFromCache({
        type,
        spec: context.spec,
        fragmentMap: context.fragmentMap,
        cache: context?.cache ?? {},
        shape: fragment.shape()({}),
        id: data.id as string,
      }) as ReturnType<F["pull"]>) ?? data;
  }

  return resultFromCache;
}

export function useQueryFragment<Ref, Shape extends { [key: string]: TypeSet }>(
  ref: Ref,
  shape: Shape
): QueryFragmentPullReturnType<Shape> {
  return (shape as any).pull(ref);
}
