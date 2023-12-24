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
import type {
  FragmentPullReturnType,
  GeneratedFragmentType,
} from "../../generate/src/syntax/select";

const clone = rfdc();

export type EdgeDBCache = Record<string, Record<string, unknown>>;

type EdgeDBContextType = {
  spec: SpecType;
  fragmentMap: FragmentMap;

  cache: EdgeDBCache;
  setCache: Dispatch<SetStateAction<EdgeDBCache>>;

  updateFragment: <F extends GeneratedFragmentType>(
    fragment: F,
    id: string,
    updater: (
      previous: NormalizeForCache<
        FragmentPullReturnType<F["expr"], ReturnType<F["raw"]>>
      >
    ) => NormalizeForCache<
      FragmentPullReturnType<F["expr"], ReturnType<F["raw"]>>
    >
  ) => void;
};

export const EdgeDBContext = createContext<EdgeDBContextType | undefined>(
  undefined
);

type FragmentValues<FPRT extends FragmentPullReturnType<any, any>> = {
  [key in keyof FPRT]: key extends `__${string}` ? FPRT[key] : never;
}[keyof FPRT] extends never
  ? Record<string, never>
  : {
      [key in keyof FPRT]: key extends `__${string}`
        ? FPRT[key] extends { id: string }
          ? NormalizeForCache<FPRT[key]>
          : never
        : never;
    }[keyof FPRT];

export type NormalizeForCache<FPRT extends FragmentPullReturnType<any, any>> = {
  [key in keyof FPRT]: FPRT[key] extends Array<infer T>
    ? T extends { id: string }
      ? Array<NormalizeForCache<T>>
      : never
    : key extends `__${string}`
    ? never
    : FPRT[key];
} & FragmentValues<FPRT>;

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
    (fragment, id, updater) => {
      setCache((previousCache) => {
        const cache = clone(previousCache);
        const fragmentDefinition = fragment.definition;

        if (!fragmentDefinition) {
          throw new Error(`Fragment ${name} not found`);
        }

        const type = findType(spec, fragmentDefinition.type_);

        if (!type) {
          throw new Error(`Type ${fragmentDefinition.type_} not found`);
        }

        const previousData = rawReadFromCache({
          id,
          spec,
          cache,
          fragmentMap,
          type,
          shape: fragmentDefinition.shape()({}),
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
