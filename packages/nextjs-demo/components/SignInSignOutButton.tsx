"use client";
import e from "@/dbschema/edgeql-js";
import { useEffect, useState } from "react";
import type {
  SignInSignOutButtonAuthedUserFragmentRef,
  UserListModalUserFragmentRef,
} from "@/dbschema/edgeql-js/manifest";
import { signIn, signOut } from "@/actions/auth";
import { parseAsBoolean, useQueryState } from "next-usequerystate";

const SignInSignOutButtonAuthedUserFragment = e.fragment(
  "SignInSignOutButtonAuthedUserFragment",
  e.User,
  (user) => ({
    id: true,
    name: true,
  })
);

export function SignInSignOutButton({
  authedUserRef,
  userRefs,
}: {
  authedUserRef: SignInSignOutButtonAuthedUserFragmentRef | null;
  userRefs: Array<UserListModalUserFragmentRef>;
}) {
  const [open, setOpen] = useQueryState("sign-in", parseAsBoolean);

  const user = authedUserRef
    ? SignInSignOutButtonAuthedUserFragment.pull(authedUserRef)
    : null;

  return (
    <>
      {user ? (
        <div className="flex items-baseline gap-x-2">
          <div>{user.name}</div>

          <form action={signOut}>
            <button className="underline text-blue-700">Sign Out</button>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="underline text-blue-700"
        >
          Sign In
        </button>
      )}

      {open && (
        <UserListModal
          userRefs={userRefs}
          onClose={() => {
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

const UserListModalUserFragment = e.fragment(
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
  const users = userRefs.map(UserListModalUserFragment.pull);

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
        className="bg-white rounded-lg p-4 w-full max-w-sm shadow-xl"
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
                  <button className="text-blue-700 underline">
                    {user.name}
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
