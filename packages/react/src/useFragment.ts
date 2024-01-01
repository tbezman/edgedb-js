"use client";

import { useContext, useEffect, useRef } from "react";
import { EdgeDBContext } from "./EdgeDBProvider";
import rfdc from "rfdc";
import { findType, readFromCache, updateCache } from "./cache";
import equal from "fast-deep-equal";

// Strictly importing the type here
import type {
  FragmentReturnType,
  ShapeExtends,
} from "../../generate/src/syntax/select";
import type { ObjectTypeExpression } from "../dbschema/edgeql-js/typesystem";

const clone = rfdc();

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
  ref: Parameters<F["pull"]>[0] | null,
  fragment: F
): ReturnType<F["pull"]> | null {
  const data = ref ? (fragment.pull(ref) as ReturnType<F["pull"]>) : null;

  if (typeof window === "undefined") {
    return data;
  }

  const context = useContext(EdgeDBContext);
  const setCache = context?.setCache;
  if (!context) {
    throw new Error(`useFragment must be used within an EdgeDBProvider`);
  }
  const type = findType(context.spec, fragment.type_);
  if (!type) {
    throw new Error(`Could not find type ${fragment.type_}`);
  }

  useEffect(() => {
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

  const resultFromCache = readFromCache({
    type,
    spec: context.spec,
    fragmentMap: context.fragmentMap,
    cache: context?.cache ?? {},
    shape: fragment.shape()({}),
    id: data.id as string,
  }) as ReturnType<F["pull"]>;

  return resultFromCache ?? data;
}
