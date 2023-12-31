"use client";

import { useContext, useEffect } from "react";
import { EdgeDBContext } from "./EdgeDBProvider";
import rfdc from "rfdc";
import { findType, readFromCache, updateCache } from "./cache";

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
>(ref: Parameters<F["pull"]>[0], fragment: F): ReturnType<F["pull"]> {
  const data = fragment.pull(ref);

  if (typeof window === "undefined") {
    return data as ReturnType<F["pull"]>;
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
    console.log("Inserting into cache");
    setCache?.((previous) => {
      const cache = clone(previous);
      updateCache({
        spec: context?.spec,
        cache,
        data: data as any,
        type,
      });
      return cache;
    });
  }, [ref]);
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
