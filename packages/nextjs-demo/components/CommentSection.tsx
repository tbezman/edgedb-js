"use client";

import { useFragment } from "../../react/src/useFragment";
import e from "@/dbschema/edgeql-js";

import { CommentCard } from "./CommentCard";
import type { CommentSectionPostFragmentRef } from "@/dbschema/edgeql-js/manifest";
import { CommentCardCommentFragment } from "@/dbschema/edgeql-js/manifest";

type CommentSectionProps = {
  postRef: CommentSectionPostFragmentRef;
};

export function CommentSection({ postRef }: CommentSectionProps) {
  const post = useFragment(
    postRef,
    e.fragment("CommentSectionPostFragment", e.Post, () => ({
      id: true,
      comments: (comment) => ({
        id: true,

        ...CommentCardCommentFragment(comment),
      }),
    }))
  );

  return post?.comments?.map((comment) => {
    return (
      <li key={comment.id}>
        <CommentCard commentRef={comment} />
      </li>
    );
  });
}
