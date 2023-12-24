import e from "../dbschema/edgeql-js";
import { bench } from "@arktype/attest";
import type { CacheTestUserFragment } from "../dbschema/edgeql-js/manifest";
import { CacheTestUserFragmentRef } from "../dbschema/edgeql-js/manifest";
import { CacheTestPostFragment } from "../dbschema/edgeql-js/manifest";
import type {
  EdgeDBContextType,
  NonFragmentValues,
  FragmentValues,
  NormalizeForCache,
} from "./EdgeDBProvider";
import type { FragmentPullReturnType } from "../dbschema/edgeql-js/select";
// Combinatorial template literals often result in expensive types- let's benchmark this one!
type makeComplexType<s extends string> = s extends `${infer head}${infer tail}`
  ? head | tail | makeComplexType<tail>
  : s;

type Prettify<T> = {
  [key in keyof T]: Prettify<T[key]>;
} & {};

type OmitNever<T> = { [K in keyof T as T[K] extends never ? never : K]: T[K] };

bench("bench type", () => {
  const context: EdgeDBContextType = {} as EdgeDBContextType;

  type RawFPRT = FragmentPullReturnType<
    (typeof CacheTestUserFragment)["expr"],
    ReturnType<(typeof CacheTestUserFragment)["raw"]>
  >;

  type FragmentValuesTest = Prettify<FragmentValues<RawFPRT>>;
  type NonFragmentValuesTest = Prettify<NonFragmentValues<RawFPRT>>;

  type Normalized = Prettify<NormalizeForCache<RawFPRT>>;

  // This is an inline snapshot that will be populated or compared when you run the file
}).types([169, "instantiations"]);
