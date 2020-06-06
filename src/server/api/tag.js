import { mapFieldsToModel } from "./lib/utils";
import { Tag, r } from "../models";

export async function getTags(organizationId, group) {
  let query = r.knex
    .select("*")
    .from("tag")
    .where("tag.organization_id", organizationId)
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
