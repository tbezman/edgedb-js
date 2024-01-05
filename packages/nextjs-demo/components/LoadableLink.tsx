"use client";

import type { ComponentProps } from "react";
import { useTransition } from "react";
import Link from "next/link";
import { Spinner } from "@/components/Spinner";
import clsx from "clsx";
import { useRouter } from "next/navigation";

export function LoadableLink({
  href,
  className,
  children,
  ...rest
}: ComponentProps<typeof Link>) {
  const router = useRouter();
  const [isTransitioning, startTransition] = useTransition();

  return (
    <Link
      {...rest}
      href={href}
      className={clsx(
        className,
        "text-blue-600 underline visited:text-gray-700 flex items-baseline gap-x-2 transition-transform duration-300 active:scale-[.99] origin-left "
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
