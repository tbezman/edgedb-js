import e from "@/dbschema/edgeql-js";
import { useQueryFragment } from "../../react/src/useFragment";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type { MostRecentCommentsQueryFragmentRef } from "@/dbschema/edgeql-js/fragments/MostRecentCommentsQueryFragment";
import { LoadableLink } from "@/components/LoadableLink";
import { Card } from "@/components/ui/card";

export function MostRecentComments({
  queryRef,
}: {
  queryRef: MostRecentCommentsQueryFragmentRef;
}) {
  const { comments } = useQueryFragment(queryRef, {
    comments: e.select(e.Comment, (comment) => ({
      id: true,
      text: true,
      author: {
        name: true,
      },
      created_at: true,
      parentPost: (post) => ({
        id: true,
      }),

      limit: 5,
      order_by: {
        direction: "DESC",
        expression: comment.created_at,
      },
      filter: e.op("exists", comment.parentPost),
    })),
  });

  return (
    <div className="flex flex-col gap-y-1">
      <h2 className="font-bold text-lg">Recent Comments</h2>

      <ul className="max-w-[200px] gap-y-4 flex flex-col">
        {comments.map((comment) => {
          return (
            <li key={comment.id}>
              <Card className="p-2">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-bold">{comment.author.name}</span>

                  <span className="text-xs whitespace-nowrap">
                    {formatDistanceToNow(comment.created_at, {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <p className="line-clamp-2 text-sm">{comment.text}</p>
                <LoadableLink
                  className="text-sm text-blue-700 underline"
                  href={`/post/${comment.parentPost?.id}?highlightedComment=${comment.id}`}
                >
                  Read More
                </LoadableLink>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
