"use client";

import { useContext, useEffect } from "react";
import { EdgeDBContext } from "./EdgeDBProvider";
import rfdc from "rfdc";
import { findType, readFromCache, updateCache } from "./cache";

// Strictly importing the type here
import type { FragmentReturnType } from "../../generate/src/syntax/select";

const clone = rfdc();

export function useFragment<F extends FragmentReturnType<any, any>>(
  ref: Parameters<F["pull"]>[0],
  fragment: F
): ReturnType<F["pull"]> {
  const context = useContext(EdgeDBContext);
  const setCache = context?.setCache;
  const data = fragment.pull(ref);

  if (!context) {
    throw new Error(`useFragment must be used within an EdgeDBProvider`);
  }

  const type = findType(context.spec, fragment.type_);

  if (!type) {
    throw new Error(`Could not find type ${fragment.type_}`);
  }

  useEffect(() => {
    setCache?.((previous) => {
      const cache = clone(previous);

      updateCache({
        spec: context?.spec,
        cache,
        data,
        type,
      });

      return cache;
    });
  }, []);

  const resultFromCache = readFromCache({
    type,
    spec: context.spec,
    fragmentMap: context.fragmentMap,
    cache: context?.cache ?? {},
    shape: fragment.shape()({}),
    id: data.id,
  }) as ReturnType<F["pull"]>;

  return resultFromCache ?? data;
}
