import { client } from "@/client";
import { Spinner } from "@/components/Spinner";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import e from "@/dbschema/edgeql-js";
import { CommentSection } from "@/components/CommentSection";
import type { SignInSignOutButtonQueryFragmentRef } from "@/dbschema/edgeql-js/manifest";
import {
  CommentSectionPostFragment,
  CommentSectionQueryFragment,
  SignInSignOutButtonQueryFragment,
} from "@/dbschema/edgeql-js/manifest";
import { SignInSignOutButton } from "@/components/SignInSignOutButton";
import { cookies } from "next/headers";
import { PostPageQueryParams } from "@/dbschema/edgeql-js/queries/PostPageQuery";

type PageProps = {
  params: { id: string };
};

export default async function PostPage({ params: pageParams }: PageProps) {
  const userUuid = cookies().get("userUuid")?.value || null;

  const query = await e.query(
    client,
    {
      post: e.select(e.Post, (post) => ({
        title: true,
        content: true,

        ...CommentSectionPostFragment(post),

        filter_single: e.op(post.id, "=", e.uuid(pageParams.id)),
      })),

      ...CommentSectionQueryFragment(),
      ...SignInSignOutButtonQueryFragment(),
    },
    PostPageQueryParams,
    {
      userUuid,
    }
  );

  if (!query.post) {
    return notFound();
  }

  return (
    <>
      <Header queryRef={query} />

      <article className="flex flex-col max-w-2xl py-4 mx-auto">
        <h1 className="text-2xl font-bold mb-2">{query.post.title}</h1>

        <p>{query.post.content}</p>

        <div className="mt-4">
          <Suspense
            fallback={
              <div className="flex items-center gap-x-2">
                <h2 className="text-xl font-bold">Comments</h2>
                <Spinner className="w-4 h-4" />
              </div>
            }
          >
            <h2 className="text-xl font-bold mb-4">Comments</h2>

            <ul className="space-y-8">
              <CommentSection queryRef={query} postRef={query.post} />
            </ul>
          </Suspense>
        </div>
      </article>
    </>
  );
}

function Header({
  queryRef,
}: {
  queryRef: SignInSignOutButtonQueryFragmentRef;
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

      <SignInSignOutButton queryRef={queryRef} />
    </div>
  );
}
