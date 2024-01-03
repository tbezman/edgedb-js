"use client";
import e from "@/dbschema/edgeql-js";
import { formatDistanceToNow } from "date-fns";
import { ReplyButton } from "./ReplyButton";
import { ReplyCommentCard } from "./ReplyCommentCard";
import type {
  CommentCardCommentFragmentRef,
  CommentCardQueryFragmentRef,
} from "@/dbschema/edgeql-js/manifest";
import {
  ReplyButtonAuthedUserFragment,
  ReplyCommentCardCommentFragment,
} from "@/dbschema/edgeql-js/manifest";
import { useFragment, useQueryFragment } from "../../react/src/useFragment";
import { useQueryState } from "next-usequerystate";
import clsx from "clsx";
import { useEffect, useRef } from "react";

type CommentCardProps = {
  queryRef: CommentCardQueryFragmentRef;
  commentRef: CommentCardCommentFragmentRef;
};

export function CommentCard({ commentRef, queryRef }: CommentCardProps) {
  const [highlightedCommentId] = useQueryState("highlightedComment");

  const comment = useFragment(commentRef, e.Comment, (comment) => ({
    id: true,
    text: true,
    created_at: true,

    author: {
      id: true,
      name: true,
    },

    replies: (reply) => ({
      id: true,

      order_by: {
        expression: reply.created_at,
        direction: "ASC",
      },

      ...ReplyCommentCardCommentFragment(reply),
    }),
  }));
  const { authedUser } = useQueryFragment(queryRef, {
    authedUser: e.select(e.User, (user) => ({
      ...ReplyButtonAuthedUserFragment(user),

      filter_single: {
        id: e.cast(e.uuid, e.param("userUuid", e.uuid)),
      },
    })),
  });

  const isHighlighted = highlightedCommentId === comment.id;

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (isHighlighted && wrapperRef.current) {
      wrapperRef.current.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
    }
  }, []);

  return (
    <div>
      <div
        className={clsx(`flex flex-col`, {
          "flash shadow -m-2 p-2 rounded-lg": isHighlighted,
        })}
      >
        <div className={clsx("flex items-baseline justify-between")}>
          <div className="flex items-baseline space-x-1">
            <a href="#" className="text-blue-700 underline">
              {comment.author.name}
            </a>
            <span>-</span>
            <span className="text-sm">
              {formatDistanceToNow(comment.created_at!)} ago
            </span>
          </div>

          {authedUser ? (
            <ReplyButton authedUserRef={authedUser} commentId={comment.id} />
          ) : null}
        </div>

        <p>{comment.text}</p>
      </div>

      {comment.replies.length > 0 ? (
        <div className="flex flex-col mt-2">
          <ul className="list-inside space-y-4">
            {comment.replies.map((reply) => {
              return (
                <li key={reply.id}>
                  <ReplyCommentCard commentRef={reply} />
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
