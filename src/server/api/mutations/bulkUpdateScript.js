import { getConfig, getFeatures } from "../lib/config";
import { accessRequired } from "../errors";
import { r, cacheableData } from "../../models";
import { getAllowed } from "../organization";
import { replaceAll } from "../lib/utils";

export const bulkUpdateScript = async (
  _,
  { organizationId, findAndReplace },
  { user }
) => {
  console.log(
    "1: about to access required ",
    organizationId,
    findAndReplace,
    user
  );
  await accessRequired(user, organizationId, "ADMIN");
  const scriptUpdatesResult = await r.knex.transaction(async trx => {
    const {
      searchString,
      replaceString,
      includeArchived,
      campaignTitlePrefixes
    } = findAndReplace;
    console.log(
      "2: after access required ",
      searchString,
      replaceString,
      includeArchived,
      campaignTitlePrefixes
    );

    let campaignIdQuery = r
      .knex("campaign")
      .transacting(trx)
      .where({ organization_id: organizationId })
      .pluck("id");
    if (!includeArchived) {
      campaignIdQuery = campaignIdQuery.where({ is_archived: false });
    }
    if (campaignTitlePrefixes.length > 0) {
      campaignIdQuery = campaignIdQuery.where(function subquery() {
        for (const prefix of campaignTitlePrefixes) {
          this.orWhere("title", "like", `${prefix}%`);
        }
      });
    }
    const campaignIds = await campaignIdQuery;

    // Using array_to_string is easier and faster than using unnest(script_options) (https://stackoverflow.com/a/7222285)
    const interactionStepsToChange = await r
      .knex("interaction_step")
      .transacting(trx)
      .select(["id", "campaign_id", "script"])
      .whereRaw("script like ?", [`%${searchString}%`])
      .whereIn("campaign_id", campaignIds);

    const scriptUpdates = [];
    for (const step of interactionStepsToChange) {
      const script = step.script;
      const newValue = replaceAll(script, searchString, replaceString);
      if (newValue !== script) {
        scriptUpdates.push({
          campaign: { id: step.campaign_id },
          found: script,
          replaced: newValue
        });
        await r
          .knex("interaction_step")
          .transacting(trx)
          .update({ script: newValue })
          .where({ id: step.id });
      }
    }

    return scriptUpdates;
  });
  // TODO: clear campaign_id caches
  return scriptUpdatesResult;
};
