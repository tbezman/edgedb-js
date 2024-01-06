"use client";

import type { ComponentProps } from "react";
import { useTransition } from "react";
import Link from "next/link";
import { Spinner } from "@/components/Spinner";
import clsx from "clsx";
import { useRouter } from "next/navigation";

export function PlainLink({
  children,
  noVisit,
  className,
  ...rest
}: ComponentProps<typeof Link> & { noVisit?: boolean }) {
  return (
    <Link
      {...rest}
      className={clsx(
        className,
        { "visited:text-zinc-600": !noVisit },
        "text-cyan-500 underline flex items-baseline gap-x-2 transition-transform duration-300 active:scale-[.99] origin-left "
      )}
    >
      {children}
    </Link>
  );
}

export function LoadableLink({
  href,
  className,
  children,
  noVisit = false,
  ...rest
}: ComponentProps<typeof Link> & { noVisit?: boolean }) {
  const router = useRouter();
  const [isTransitioning, startTransition] = useTransition();

  return (
    <Link
      {...rest}
      href={href}
      className={clsx(
        className,
        { "visited:text-zinc-600": !noVisit },
        "text-cyan-500 underline flex items-baseline gap-x-2 transition-transform duration-300 active:scale-[.99] origin-left "
      )}
      onClick={(e) => {
        e.preventDefault();

        startTransition(() => {
          if (typeof href === "string") {
            router.push(href);
          }
        });
      }}
    >
      {children}
      {isTransitioning ? <Spinner className="w-3 h-3" /> : null}
    </Link>
  );
}
