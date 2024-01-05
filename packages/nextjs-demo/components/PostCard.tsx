"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import e from "@/dbschema/edgeql-js";
import { Spinner } from "./Spinner";
import type { PostCardPostFragmentRef } from "@/dbschema/edgeql-js/manifest";
import { useFragment } from "../../react/src/useFragment";
import { LoadableLink } from "@/components/LoadableLink";

type PostCardProps = {
  postRef: PostCardPostFragmentRef;
};

export function PostCard({ postRef }: PostCardProps) {
  const post = useFragment(postRef, e.Post, () => ({
    id: true,
    title: true,
    content: true,
  }));

  const router = useRouter();
  const [isTransitioning, startTransition] = useTransition();

  return (
    <article className="flex flex-col max-w-xl mx-auto">
      <LoadableLink
        draggable={false}
        href={`/post/${post.id}`}
        className=""
      >
        <h3 className="font-medium">{post.title}</h3>
      </LoadableLink>

      <p className="line-clamp-2">{post.content}</p>
    </article>
  );
}

export function FallbackCard() {
  return (
    <article className="flex flex-col max-w-xl mx-auto space-y-1">
      <h3 className="h-5 font-medium bg-blue-100 animate-pulse rounded" />

      <p className="h-12 flex-grow bg-blue-100 animate-pulse rounded"></p>
    </article>
  );
}
