import { r } from "../../../src/server/models";
import uuid from "uuid";

const DEFAULT_ORGANIZATION_NAME = "E2E Test Organization";

export async function getOrCreateTestOrganization() {
  let org = await r
    .knex("organization")
    .where("name", DEFAULT_ORGANIZATION_NAME)
    .first();
  if (!org) {
    org = await r
      .knex("organization")
      .insert({
        name: DEFAULT_ORGANIZATION_NAME,
        uuid: uuid.v4(),
        features: JSON.stringify({ EXPERIMENTAL_PHONE_INVENTORY: true })
      })
      .returning("*");
  }
  return org.id;
}
