import e from "../dbschema/edgeql-js";
import createClient from "edgedb";

const client = createClient();

beforeEach(async () => {
  await e.delete(e.Comment).run(client);
  await e.delete(e.Post).run(client);
  await e.delete(e.User).run(client);
});
