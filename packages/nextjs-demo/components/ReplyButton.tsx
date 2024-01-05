"use client";
import e from "@/dbschema/edgeql-js";
import { motion, AnimatePresence } from "framer-motion";
import { faker } from "@faker-js/faker";

import Link from "next/link";
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

  return (
    <div className="relative">
      <Link
        replace
        scroll={false}
        onClick={(e) => {
          e.preventDefault();
          setReplyTo(commentId);
        }}
        href={`?reply_to=${commentId}`}
        className="text-blue-700 underline text-sm"
      >
        Reply
      </Link>

      <AnimatePresence>
        {replyTo === commentId ? (
          <motion.form
            ref={formRef}
            animate={{ y: [4, 0], opacity: [0, 1] }}
            action={handleSubmit}
            onSubmit={insertOptimistic}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 mt-4 z-10 bg-white px-6 py-4 rounded flex flex-col drop-shadow-2xl"
          >
            <textarea
              name="text"
              className="w-[500px] rounded p-1 border border-blue-300"
              rows={10}
              defaultValue={faker.lorem.paragraph(3)}
            />

            <input name="commentId" type="hidden" value={commentId} />
            <input name="newCommentId" type="hidden" value={nextCommentId} />

            <SubmitButton />
          </motion.form>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function SubmitButton() {
  const status = useFormStatus();

  return (
    <button className="bg-blue-900 text-white w-24 mt-2 p-2 self-end rounded">
      {status.pending ? "..." : "Reply"}
    </button>
  );
}
