import { client } from "@/client";
import { FallbackCard, PostCard } from "@/components/PostCard";
import { PropsWithChildren, Suspense } from "react";
import e from "@/dbschema/edgeql-js";
import {
  PostCardPostFragment,
  SignInSignOutButtonQueryFragment,
} from "@/dbschema/edgeql-js/manifest";
import { SignInSignOutButton } from "@/components/SignInSignOutButton";
import { cookies } from "next/headers";

export default async function Home() {
  const userUuid = cookies().get("userUuid")?.value || undefined;

  const query = await e
    .params({ userUuid: e.optional(e.uuid) }, (params) => {
      return e.select({
        posts: e.select(e.Post, (post) => ({
          id: true,

          ...PostCardPostFragment(post),
        })),

        ...SignInSignOutButtonQueryFragment(),
      });
    })
    .run(client, {
      userUuid,
    });

  return (
    <div className="py-4 px-4">
      <div className="flex items-center justify-between sticky top-4">
        <Title>Posts</Title>

        <SignInSignOutButton queryRef={query} />
      </div>

      <ul className="list-inside space-y-4">
        {query.posts.map((post) => {
          return (
            <li key={post.id}>
              <Suspense fallback={<FallbackCard />}>
                <PostCard postRef={post} />
              </Suspense>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Title({ children }: PropsWithChildren) {
  return (
    <div className="flex items-center justify-between sticky top-4">
      <h1 className="text-2xl font-bold mb-2">{children}</h1>
    </div>
  );
}
