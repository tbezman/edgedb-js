import e from "@/dbschema/edgeql-js";
import { formatDistanceToNow } from "date-fns";
import { ReplyButton } from "./ReplyButton";
import { ReplyCommentCard } from "./ReplyCommentCard";
import {
  CommentCardAuthedUserFragmentRef,
  CommentCardCommentFragmentRef,
  ReplyButtonAuthedUserFragment,
} from "@/dbschema/edgeql-js/manifest";
import { ReplyCommentCardCommentFragment } from "@/dbschema/edgeql-js/manifest";
import { useFragment } from "../../react/src/useFragment";

type CommentCardProps = {
  authedUserRef: CommentCardAuthedUserFragmentRef | null;
  commentRef: CommentCardCommentFragmentRef;
};

const CommentCardAuthedUserFragment = e.fragment(
  "CommentCardAuthedUserFragment",
  e.User,
  (user) => ({
    id: true,
    ...ReplyButtonAuthedUserFragment(user),
  })
);

const CommentCardCommentFragment = e.fragment(
  "CommentCardCommentFragment",
  e.Comment,
  (comment) => ({
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
  })
);

export function CommentCard({ commentRef, authedUserRef }: CommentCardProps) {
  const comment = useFragment(commentRef, CommentCardCommentFragment);
  const authedUser = useFragment(authedUserRef, CommentCardAuthedUserFragment);

  return (
    <div>
      <div className="flex items-baseline justify-between">
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
