"use client";
import "client-only";

import React from "react";
import type { FragmentMap, SpecType } from "./cache";
import {
  findType,
  readFromCache as rawReadFromCache,
  updateCache,
} from "./cache";
import type { Dispatch, PropsWithChildren, SetStateAction } from "react";
import { createContext, useCallback, useMemo, useState } from "react";

import rfdc from "rfdc";

const clone = rfdc();

export type EdgeDBCache = Record<string, Record<string, unknown>>;

type EdgeDBContextType = {
  spec: SpecType;
  fragmentMap: FragmentMap;

  cache: EdgeDBCache;
  setCache: Dispatch<SetStateAction<EdgeDBCache>>;

  updateFragment: (
    name: string,
    id: string,
    updater: (previous: any) => any
  ) => void;
};

export const EdgeDBContext = createContext<EdgeDBContextType | undefined>(
  undefined
);

export function EdgeDBProvider({
  spec,
  children,
  fragmentMap,
}: PropsWithChildren<{
  spec: SpecType;
  fragmentMap: FragmentMap;
}>) {
  const [cache, setCache] = useState<EdgeDBCache>(() => ({}));

  const updateFragment = useCallback<EdgeDBContextType["updateFragment"]>(
    (name, id, updater) => {
      setCache((previousCache) => {
        const cache = clone(previousCache);
        const fragmentDefinion = fragmentMap.get(name);

        if (!fragmentDefinion) {
          throw new Error(`Fragment ${name} not found`);
        }

        const type = findType(spec, fragmentDefinion.type_);

        if (!type) {
          throw new Error(`Type ${fragmentDefinion.type_} not found`);
        }

        const previousData = rawReadFromCache({
          id,
          spec,
          cache,
          fragmentMap,
          type,
          shape: fragmentDefinion.shape()({}),
        });

        const newData = previousData
          ? { ...previousData, ...updater(previousData) }
          : { ...updater(previousData) };

        updateCache({
          spec,
          cache,
          data: newData,
          type,
        });

        return cache;
      });
    },
    []
  );

  const value = useMemo(
    (): EdgeDBContextType => ({
      spec,
      fragmentMap,
      cache,
      setCache,
      updateFragment,
    }),
    [cache, updateFragment]
  );

  return (
    <EdgeDBContext.Provider value={value}>{children}</EdgeDBContext.Provider>
  );
}
