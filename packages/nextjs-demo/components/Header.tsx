import { useQueryFragment } from "@edgedb/react/src/useFragment";
import { SignInSignOutButtonQueryFragment } from "@/dbschema/edgeql-js/fragments/SignInSignOutButtonQueryFragment";
import { SignInSignOutButton } from "@/components/SignInSignOutButton";
import type { HeaderQueryFragmentRef } from "@/dbschema/edgeql-js/fragments/HeaderQueryFragment";
import type { PropsWithChildren } from "react";

export function Header({
  queryRef,
  children,
}: PropsWithChildren<{ queryRef: HeaderQueryFragmentRef }>) {
  const query = useQueryFragment(queryRef, {
    ...SignInSignOutButtonQueryFragment(),
  });

  return (
    <div className="flex items-center justify-between top-0 sticky py-4">
      {children ?? <div />}

      <SignInSignOutButton queryRef={query} />
    </div>
  );
}

export function HeaderTitle({ children }: PropsWithChildren) {
  return <div className="text-3xl font-bold">{children}</div>;
}
