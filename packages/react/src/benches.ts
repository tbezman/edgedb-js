import { bench } from "@arktype/attest";
import { CacheTestUserFragment } from "../dbschema/edgeql-js/manifest";
import type {
  EdgeDBContextType,
  NonFragmentValues,
  FragmentValues,
  NormalizeForCache,
} from "./EdgeDBProvider";
import type { FragmentPullReturnType } from "../dbschema/edgeql-js/select";

type Prettify<T> = {
  [key in keyof T]: Prettify<T[key]>;
} & {};

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

bench("full use case", () => {
  const context: EdgeDBContextType = {} as EdgeDBContextType;

  context.updateFragment(CacheTestUserFragment, "some-uuid", (previous) => {
    return {
      ...previous,
      posts: [
        ...previous.posts,
        {
          id: "some-uuid",
          title: "Some title here",
        },
      ],
    };
  });

  // This is an inline snapshot that will be populated or compared when you run the file
}).types([169, "instantiations"]);
