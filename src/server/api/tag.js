import { mapFieldsToModel } from "./lib/utils";
import { Tag, r } from "../models";
import { getConfig } from "../api/lib/config";

export async function getTags(organization, group) {
  if (getConfig("EXPERIMENTAL_TAGS", null, { truthy: 1 }) === false) {
    return [];
  }

  // TODO: need to cache this on organization object
  let query = r.knex
    .select("*")
    .from("tag")
    .where("tag.organization_id", organization.id)
    .where("tag.is_deleted", false);
  if (group) {
    query = query.where("group", group);
  }
  return query;
}

export const resolvers = {
  Tag: {
    ...mapFieldsToModel(
      ["id", "name", "group", "description", "isDeleted", "organizationId"],
      Tag
    )
  }
};
