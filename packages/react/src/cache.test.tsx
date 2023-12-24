import type { PropsWithChildren } from "react";
import React, { useCallback, useContext } from "react";
import { fireEvent, render } from "@testing-library/react";
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

function UserWithPosts({ userRef }: { userRef: CacheTestUserFragmentRef }) {
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
      title: true,
    }))
  );

  return (
    <div data-testid={`Post-${post.id}`}>
      <div data-testid="PostId">{post.id}</div>
      <div data-testid="PostTitle">{post.title}</div>
    </div>
  );
}

function CachePrinter() {
  const context = useContext(EdgeDBContext);

  return <div data-testid="cache">{JSON.stringify(context?.cache)}</div>;
}

function Fixture({ children }: PropsWithChildren) {
  return (
    <EdgeDBProvider spec={spec} fragmentMap={fragmentMap}>
      {children}

      <CachePrinter />
    </EdgeDBProvider>
  );
}

const mockUserUuid = "051e0681-4eb7-4f80-bb20-eab95f24f055";
const mockPostUuid = "cd3e0bcc-6b8f-476f-9426-8d3b70faf3ad";

describe("cache", () => {
  beforeEach(async () => {
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
  });

  it("can include fragments in the response", async () => {
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
                  "title": "Some Blog Post",
                },
                "id": "cd3e0bcc-6b8f-476f-9426-8d3b70faf3ad",
              },
            ],
          },
        },
      ]
    `);
  });

  it("can fill the cache with a response", async () => {
    const users = await e
      .select(e.User, (user) => ({
        id: true,
        ...CacheTestUserFragment(user),
      }))
      .run(client);

    const { findByTestId } = render(
      <Fixture>
        <UserWithPosts userRef={users[0]} />
      </Fixture>
    );

    const userID = await findByTestId("UserId");

    expect(userID.textContent).toBe(users[0].id);

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
          "id": "cd3e0bcc-6b8f-476f-9426-8d3b70faf3ad",
          "title": "Some Blog Post",
        },
      }
    `);
  });

  it("can update the cache", async () => {
    const mockNewPostUuid = "ce88b44d-84c5-4bca-8806-ba1af3b5b3d4";

    function InsertFakePostButton({ userId }: { userId: string }) {
      const context = useContext(EdgeDBContext);

      const handleClick = useCallback(() => {
        context?.updateFragment("CacheTestUserFragment", userId, (previous) => {
          return {
            ...previous,
            posts: [
              ...previous.posts,
              { id: mockNewPostUuid, title: "new post" },
            ],
          };
        });
      }, []);

      return (
        <button onClick={handleClick} data-testid="insert-fake-post">
          Insert Fake Post
        </button>
      );
    }

    const users = await e
      .select(e.User, (user) => ({
        id: true,
        ...CacheTestUserFragment(user),
      }))
      .run(client);

    const { findByTestId } = render(
      <Fixture>
        <UserWithPosts userRef={users[0]} />

        <InsertFakePostButton userId={users[0].id} />
      </Fixture>
    );

    let cacheElement = await findByTestId("cache");
    let cache = JSON.parse(cacheElement.textContent ?? "");

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
          "id": "cd3e0bcc-6b8f-476f-9426-8d3b70faf3ad",
          "title": "Some Blog Post",
        },
      }
    `);

    const insertFakePostButton = await findByTestId("insert-fake-post");

    await fireEvent.click(insertFakePostButton);

    cacheElement = await findByTestId("cache");
    cache = JSON.parse(cacheElement.textContent ?? "");

    expect(cache).toMatchInlineSnapshot(`
      {
        "051e0681-4eb7-4f80-bb20-eab95f24f055": {
          "id": "051e0681-4eb7-4f80-bb20-eab95f24f055",
          "posts": [
            {
              "__ref__": "cd3e0bcc-6b8f-476f-9426-8d3b70faf3ad",
            },
            {
              "__ref__": "ce88b44d-84c5-4bca-8806-ba1af3b5b3d4",
            },
          ],
        },
        "cd3e0bcc-6b8f-476f-9426-8d3b70faf3ad": {
          "id": "cd3e0bcc-6b8f-476f-9426-8d3b70faf3ad",
          "title": "Some Blog Post",
        },
        "ce88b44d-84c5-4bca-8806-ba1af3b5b3d4": {
          "id": "ce88b44d-84c5-4bca-8806-ba1af3b5b3d4",
          "title": "new post",
        },
      }
    `);

    const firstPost = await findByTestId(`Post-${mockPostUuid}`);
    const secondPost = await findByTestId(`Post-${mockNewPostUuid}`);

    expect(firstPost.children[1].textContent).toBe("Some Blog Post");
    expect(secondPost.children[1].textContent).toBe("new post");
  });
});
