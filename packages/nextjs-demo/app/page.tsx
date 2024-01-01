import { client } from "@/client";
import { FallbackCard, PostCard } from "@/components/PostCard";
import { PropsWithChildren, Suspense } from "react";
import e from "@/dbschema/edgeql-js";
import {
  PostCardPostFragment,
  UserListModalAuthedUserFragment,
  UserListModalUserFragment,
} from "@/dbschema/edgeql-js/manifest";
import { SignInSignOutButton } from "@/components/SignInSignOutButton";
import { cookies } from "next/headers";

export default async function Home() {
  const userUuid = cookies().get("userUuid")?.value;

  const [posts, users, authedUser] = await Promise.all([
    e
      .select(e.Post, (post) => ({
        id: true,

        ...PostCardPostFragment(post),
      }))
      .run(client),
    e
      .select(e.User, (user) => ({
        ...UserListModalUserFragment(user),
      }))
      .run(client),
    userUuid
      ? e
          .select(e.User, (user) => ({
            ...UserListModalAuthedUserFragment(user),
            filter_single: e.op(user.id, "=", e.uuid(userUuid)),
          }))
          .run(client)
      : null,
  ]);

  return (
    <div className="py-4 px-4">
      <div className="flex items-center justify-between sticky top-4">
        <Title>Posts</Title>

        <SignInSignOutButton authedUserRef={authedUser} userRefs={users} />
      </div>

      <ul className="list-inside space-y-4">
        {posts.map((post) => {
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
