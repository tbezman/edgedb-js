import { client } from "@/client";
import { Spinner } from "@/components/Spinner";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import e from "@/dbschema/edgeql-js";
import { CommentSection } from "@/components/CommentSection";
import {
  CommentCardAuthedUserFragment,
  SignInSignOutButtonAuthedUserFragment,
  SignInSignOutButtonAuthedUserFragmentRef,
  UserListModalUserFragmentRef,
} from "@/dbschema/edgeql-js/manifest";
import {
  CommentSectionPostFragment,
  UserListModalUserFragment,
} from "@/dbschema/edgeql-js/manifest";
import { SignInSignOutButton } from "@/components/SignInSignOutButton";
import { cookies } from "next/headers";

type PageProps = {
  params: { id: string };
};

export default async function PostPage({ params }: PageProps) {
  const userUuid = cookies().get("userUuid")?.value;

  const [post, users, authedUser] = await Promise.all([
    e
      .select(e.Post, (post) => ({
        title: true,
        content: true,

        ...CommentSectionPostFragment(post),

        filter_single: e.op(post.id, "=", e.uuid(params.id)),
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
            ...SignInSignOutButtonAuthedUserFragment(user),
            ...CommentCardAuthedUserFragment(user),

            filter_single: e.op(user.id, "=", e.uuid(userUuid)),
          }))
          .run(client)
      : null,
  ]);

  if (!post) {
    return notFound();
  }

  return (
    <>
      <Header authedUserRef={authedUser} userRefs={users} />

      <article className="flex flex-col max-w-2xl py-4 mx-auto">
        <h1 className="text-2xl font-bold mb-2">{post.title}</h1>

        <p>{post.content}</p>

        <div className="mt-4">
          <Suspense
            fallback={
              <div className="flex items-center gap-x-2">
                <h2 className="text-xl font-bold">Comments</h2>
                <Spinner className="w-4 h-4" />
              </div>
            }
          >
            <h2 className="text-xl font-bold">Comments</h2>

            <ul className="space-y-8">
              <CommentSection authedUserRef={authedUser} postRef={post} />
            </ul>
          </Suspense>
        </div>
      </article>
    </>
  );
}

function Header({
  authedUserRef,
  userRefs,
}: {
  authedUserRef: SignInSignOutButtonAuthedUserFragmentRef | null;
  userRefs: Array<UserListModalUserFragmentRef>;
}) {
  return (
    <div className="flex items-center justify-between sticky top-4">
      <Link
        href="/"
        className="flex items-center space-x-1 underline sticky mt-4 ml-4"
      >
        &lt;
        <span>Back to home</span>
      </Link>

      <SignInSignOutButton authedUserRef={authedUserRef} userRefs={userRefs} />
    </div>
  );
}
