import e from "../dbschema/edgeql-js";
import { bench } from "@arktype/attest";
import {
  CacheTestPostFragment,
  CacheTestUserFragment,
} from "../dbschema/edgeql-js/manifest";
import type { EdgeDBContextType } from "./EdgeDBProvider";
// Combinatorial template literals often result in expensive types- let's benchmark this one!
type makeComplexType<s extends string> = s extends `${infer head}${infer tail}`
  ? head | tail | makeComplexType<tail>
  : s;

bench("bench type", () => {
  const context: EdgeDBContextType = {} as EdgeDBContextType;

  context?.updateFragment(CacheTestUserFragment, "", (previous) => ({
    ...previous,
    posts: [
      ...previous.posts,
      {
        id: "some-uuid",
      },
    ],
  }));

  // This is an inline snapshot that will be populated or compared when you run the file
}).types([169, "instantiations"]);
