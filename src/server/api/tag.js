import { mapFieldsToModel } from "./lib/utils";
import { Tag, r } from "../models";

export async function getTags(organizationId) {
  return r.knex
    .select("*")
    .from("tag")
    .where("tag.organization_id", organizationId);
}

export const resolvers = {
  Tag: {
    ...mapFieldsToModel(
      ["id", "name", "group", "description", "isDeleted", "organizationId"],
      Tag
    )
  },
  TagsList: {
    tags: tags => tags
  }
};
