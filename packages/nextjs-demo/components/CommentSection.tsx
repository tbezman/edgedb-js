"use client";

import { useFragment, useQueryFragment } from "../../react/src/useFragment";
import e from "@/dbschema/edgeql-js";

import { CommentCard } from "./CommentCard";
import type {
  CommentSectionPostFragmentRef,
  CommentSectionQueryFragmentRef,
} from "@/dbschema/edgeql-js/manifest";
import {
  CommentCardCommentFragment,
  CommentCardQueryFragment,
} from "@/dbschema/edgeql-js/manifest";

type CommentSectionProps = {
  queryRef: CommentSectionQueryFragmentRef;
  postRef: CommentSectionPostFragmentRef;
};

export function CommentSection({ queryRef, postRef }: CommentSectionProps) {
  const query = useQueryFragment(
    queryRef,
    e.queryFragment("CommentSectionQueryFragment", {
      ...CommentCardQueryFragment(),
    })
  );

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
        <CommentCard queryRef={query} commentRef={comment} />
      </li>
    );
  });
}
