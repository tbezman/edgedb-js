import React, { useContext } from "react";
import { render } from "@testing-library/react";
import e, { createClient } from "../dbschema/edgeql-js";
import type {
  CacheTestPostFragmentRef,
  CacheTestUserFragmentRef,
} from "../dbschema/edgeql-js/manifest";
import {
  CacheTestPostFragment,
  CacheTestUserFragment,
  fragmentMap,
} from "../dbschema/edgeql-js/manifest";
import { useFragment } from "./useFragment";
import { EdgeDBContext, EdgeDBProvider } from "./EdgeDBProvider";
import { spec } from "../dbschema/edgeql-js/__spec__";

const client = createClient().withConfig({ allow_user_specified_id: true });

it("can run", async () => {
  const mockUserUuid = "051e0681-4eb7-4f80-bb20-eab95f24f055";
  const mockPostUuid = "cd3e0bcc-6b8f-476f-9426-8d3b70faf3ad";

  await e
    .insert(e.User, {
      id: mockUserUuid,
      name: "Test User",
      age: 24,
    })
    .run(client);

  await e
    .insert(e.Post, {
      id: mockPostUuid,
      title: "Some Blog Post",
      content: "Some Content",
      author: e.select(e.User, (user) => {
        return { filter_single: e.op(user.id, "=", e.uuid(mockUserUuid)) };
      }),
      published: false,
    })
    .run(client);

  const users = await e
    .select(e.User, (user) => ({
      ...CacheTestUserFragment(user),
    }))
    .run(client);

  expect(users).toMatchInlineSnapshot(`
    [
      {
        "__CacheTestUserFragment": {
          "id": "051e0681-4eb7-4f80-bb20-eab95f24f055",
          "posts": [
            {
              "__CacheTestPostFragment": {
                "id": "cd3e0bcc-6b8f-476f-9426-8d3b70faf3ad",
              },
              "id": "cd3e0bcc-6b8f-476f-9426-8d3b70faf3ad",
            },
          ],
        },
      },
    ]
  `);

  expect(users.length).toBe(1);

  function TestComponent({ userRef }: { userRef: CacheTestUserFragmentRef }) {
    const user = useFragment(
      userRef,
      e.fragment("CacheTestUserFragment", e.User, (user) => ({
        id: true,

        posts: (post) => ({
          id: true,

          ...CacheTestPostFragment(post),
        }),
      }))
    );

    return (
      <div>
        <div data-testid="UserId">{user.id}</div>

        <div data-testid="Posts">
          {user.posts.map((post) => {
            return <Post key={post.id} postRef={post} />;
          })}
        </div>
      </div>
    );
  }

  function Post({ postRef }: { postRef: CacheTestPostFragmentRef }) {
    const post = useFragment(
      postRef,
      e.fragment("CacheTestPostFragment", e.Post, (post) => ({
        id: true,
      }))
    );

    return (
      <div data-testid="Post">
        <div data-testid="PostId">{post.id}</div>
      </div>
    );
  }

  function CachePrinter() {
    const context = useContext(EdgeDBContext);

    return <div data-testid="cache">{JSON.stringify(context?.cache)}</div>;
  }

  const { findByTestId } = render(
    <EdgeDBProvider spec={spec} fragmentMap={fragmentMap}>
      <TestComponent userRef={users[0]} />

      <CachePrinter />
    </EdgeDBProvider>
  );

  const userID = await findByTestId("UserId");

  expect(userID.textContent).toBe(mockUserUuid);

  const cacheElement = await findByTestId("cache");
  const cache = JSON.parse(cacheElement.textContent ?? "");

  expect(cache).toMatchInlineSnapshot(`
    {
      "051e0681-4eb7-4f80-bb20-eab95f24f055": {
        "id": "051e0681-4eb7-4f80-bb20-eab95f24f055",
        "posts": [
          {
            "__ref__": "cd3e0bcc-6b8f-476f-9426-8d3b70faf3ad",
          },
        ],
      },
      "cd3e0bcc-6b8f-476f-9426-8d3b70faf3ad": {
        "__CacheTestPostFragment": {
          "id": "cd3e0bcc-6b8f-476f-9426-8d3b70faf3ad",
        },
        "id": "cd3e0bcc-6b8f-476f-9426-8d3b70faf3ad",
      },
    }
  `);
});
