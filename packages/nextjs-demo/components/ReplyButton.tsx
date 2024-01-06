"use client";
import e from "@/dbschema/edgeql-js";
import { faker } from "@faker-js/faker";
import { useContext, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { useQueryState } from "next-usequerystate";
import { EdgeDBContext } from "../../react/src/EdgeDBProvider";
import { submitReply } from "@/actions/submitReply";
import type { ReplyButtonAuthedUserFragmentRef } from "@/dbschema/edgeql-js/manifest";
import {
  CommentCardCommentFragment,
  ReplyButtonAuthedUserFragmentDefinition,
} from "@/dbschema/edgeql-js/manifest";

import { v4 } from "uuid";
import { useFragment } from "../../react/src/useFragment";
import { PlainLink } from "@/components/LoadableLink";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

e.fragment("ReplyButtonAuthedUserFragment", e.User, (user) => ({
  id: true,
  name: true,
}));

type ReplyButtonProps = {
  commentId: string;
  authedUserRef: ReplyButtonAuthedUserFragmentRef;
};

export function ReplyButton({ commentId, authedUserRef }: ReplyButtonProps) {
  const authedUser = useFragment(
    authedUserRef,
    ReplyButtonAuthedUserFragmentDefinition
  );

  const [nextCommentId, setNextCommentId] = useState(faker.string.uuid());
  const [replyTo, setReplyTo] = useQueryState("reply_to", { shallow: true });
  const [, setHighlightedCommentId] = useQueryState("highlightedComment");

  const router = useRouter();
  const context = useContext(EdgeDBContext);

  function insertOptimistic() {
    if (!formRef.current) {
      return;
    }

    setReplyTo(null);

    const formData = new FormData(formRef.current);
    const fakeUuid = v4();
    const commentText = formData.get("text") as string;

    context?.updateFragment(
      CommentCardCommentFragment,
      commentId,
      (previous) => {
        return {
          ...previous,
          replies: [
            ...previous.replies,
            {
              __optimistic__: true,
              id: fakeUuid,
              author: authedUser,

              text: commentText,
            },
          ],
        };
      }
    );

    setHighlightedCommentId(nextCommentId, { shallow: true });
  }

  async function handleSubmit(data: FormData) {
    const reply = await submitReply(data);

    setNextCommentId(faker.string.uuid());

    setHighlightedCommentId(reply.id, { shallow: false });
  }

  const formRef = useRef<HTMLFormElement | null>(null);
  useEffect(() => {
    if (formRef.current && replyTo === commentId) {
      formRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [commentId, replyTo]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        replyTo === commentId &&
        !(event.target instanceof HTMLAnchorElement)
      ) {
        setReplyTo(null);
      }
    }

    window.addEventListener("click", handleClickOutside);

    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  }, [commentId, replyTo, router, setReplyTo]);

  const open = replyTo === commentId;

  return (
    <div className="relative">
      <Popover open={open}>
        <PopoverTrigger>
          <PlainLink
            noVisit
            replace
            scroll={false}
            onClick={() => {
              setReplyTo(commentId);
            }}
            href={`?reply_to=${commentId}`}
          >
            Reply
          </PlainLink>
        </PopoverTrigger>

        <PopoverContent align="end" className="w-[500px]">
          <form
            ref={formRef}
            action={handleSubmit}
            onSubmit={insertOptimistic}
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col"
          >
            <Textarea
              name="text"
              className="text-lg"
              rows={10}
              defaultValue={faker.lorem.paragraph(3)}
            />

            <input name="commentId" type="hidden" value={commentId} />
            <input name="newCommentId" type="hidden" value={nextCommentId} />

            <SubmitButton />
          </form>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function SubmitButton() {
  const status = useFormStatus();

  return <Button className="mt-4">{status.pending ? "..." : "Reply"}</Button>;
}
