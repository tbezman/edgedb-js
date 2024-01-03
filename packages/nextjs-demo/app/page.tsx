import { client } from "@/client";
import { FallbackCard, PostCard } from "@/components/PostCard";
import type { PropsWithChildren } from "react";
import { Suspense } from "react";
import e from "@/dbschema/edgeql-js";
import {
  MostRecentCommentsQueryFragment,
  PostCardPostFragment,
  SignInSignOutButtonQueryFragment,
} from "@/dbschema/edgeql-js/manifest";
import { SignInSignOutButton } from "@/components/SignInSignOutButton";
import { cookies } from "next/headers";
import { HomeQueryParams } from "@/dbschema/edgeql-js/queries/HomeQuery";
import { MostRecentComments } from "@/components/MostRecentComments";

export default async function Home() {
  const userUuid = cookies().get("userUuid")?.value || undefined;

  const query = await e.query(
    client,
    {
      posts: e.select(e.Post, (post) => ({
        id: true,

        ...PostCardPostFragment(post),
      })),

      ...SignInSignOutButtonQueryFragment(),
      ...MostRecentCommentsQueryFragment(),
    },
    HomeQueryParams,
    {
      userUuid,
    }
  );

  return (
    <div className="py-4 px-4">
      <div className="flex items-center justify-between sticky top-4">
        <Title>Posts</Title>

        <SignInSignOutButton queryRef={query} />
      </div>

      <div className="fixed top-14 left-4">
        <MostRecentComments queryRef={query} />
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
