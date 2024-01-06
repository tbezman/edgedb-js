"use client";
import e from "@/dbschema/edgeql-js";
import { useEffect } from "react";
import type {
  SignInSignOutButtonQueryFragmentRef,
  UserListModalUserFragmentRef,
} from "@/dbschema/edgeql-js/manifest";
import { UserListModalUserFragment } from "@/dbschema/edgeql-js/manifest";
import { signIn, signOut } from "@/actions/auth";
import { parseAsBoolean, useQueryState } from "next-usequerystate";
import { useFragment, useQueryFragment } from "@edgedb/react/src/useFragment";
import { Button } from "@/components/ui/button";

export function SignInSignOutButton({
  queryRef,
}: {
  queryRef: SignInSignOutButtonQueryFragmentRef;
}) {
  const [open, setOpen] = useQueryState("sign-in", parseAsBoolean);

  const { authedUser: user, users } = useQueryFragment(queryRef, {
    users: e.select(e.User, (user) => ({
      ...UserListModalUserFragment(user),
    })),
    authedUser: e.select(e.User, (user) => {
      return {
        id: true,
        name: true,

        filter_single: {
          id: e.cast(e.uuid, e.param("userUuid", e.uuid, true)),
        },
      };
    }),
  });

  return (
    <>
      {user ? (
        <div className="flex items-baseline gap-x-2">
          <div>{user.name}</div>

          <form action={signOut}>
            <Button size="sm">Sign Out</Button>
          </form>
        </div>
      ) : (
        <Button size="sm" onClick={() => setOpen(true)}>
          Sign In
        </Button>
      )}

      {open && (
        <UserListModal
          userRefs={users}
          onClose={() => {
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

const UserListModalUserFragmentDefinition = e.fragment(
  "UserListModalUserFragment",
  e.User,
  (user) => ({
    id: true,
    name: true,
  })
);

function UserListModal({
  onClose,
  userRefs,
}: {
  onClose: () => void;
  userRefs: Array<UserListModalUserFragmentRef>;
}) {
  const [, setOpen] = useQueryState("sign-in", parseAsBoolean);
  const users = useFragment(userRefs, UserListModalUserFragmentDefinition);

  useEffect(() => {
    // hide the scrollbar
    document.body.style.overflowY = "hidden";

    return () => {
      document.body.style.overflowY = "auto";
    };
  }, []);

  return (
    <div
      onClick={() => {
        onClose();
      }}
      className="fixed inset-0 bg-black/20 flex items-center justify-center"
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="bg-secondary rounded-lg p-4 w-full max-w-sm shadow-xl"
      >
        <h2 className="text-2xl font-bold mb-4">Users</h2>

        <ul className="space-y-4">
          {users.map((user) => {
            return (
              <li key={user.id}>
                <form
                  action={signIn}
                  onSubmit={() => {
                    setOpen(false);
                  }}
                >
                  <input type="hidden" name="userUuid" value={user.id} />
                  <Button size="sm">{user.name}</Button>
                </form>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
