"use server";

import { client } from "@/client";
import e from "@/dbschema/edgeql-js";
import { cookies } from "next/headers";

export async function submitReply(formData: FormData) {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const userUuid = cookies().get("userUuid")?.value;

  const loggedInUser = userUuid
    ? e.select(e.User, (user) => {
        return {
          filter_single: e.op(e.uuid(userUuid), "=", user.id),
        };
      })
    : null;

  if (!loggedInUser) {
    throw new Error("Can't submit a comment while signed out.");
  }

  const text = formData.get("text")?.toString();
  const commentId = formData.get("commentId")?.toString();
  const newCommentId = formData.get("newCommentId")?.toString();

  if (!text) {
    throw new Error("Missing text");
  }

  const parentComment = commentId
    ? e.select(e.Comment, (comment) => ({
        filter_single: e.op(comment.id, "=", e.uuid(commentId)),
      }))
    : undefined;

  return await e
    .insert(e.Comment, {
      id: newCommentId,
      text,
      author: loggedInUser,
      parentComment,
    })
    .run(client);
}
