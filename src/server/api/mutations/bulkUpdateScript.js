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
      campaignTitlePrefixes,
      targetObject
    } = findAndReplace;
    console.log(
      "2: after access required ",
      searchString,
      replaceString,
      includeArchived,
      campaignTitlePrefixes
    );

    // TODO: turn into subquery
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
    const scriptUpdates = [];

    if (targetObject.indexOf("interactionStep") >= 0) {
      const interactionStepsToChange = await r
        .knex("interaction_step")
        .transacting(trx)
        .select(["id", "campaign_id", "script"])
        .whereRaw("script like ?", [`%${searchString}%`])
        .whereIn("campaign_id", campaignIds);

      for (const step of interactionStepsToChange) {
        const script = step.script;
        const newValue = replaceAll(script, searchString, replaceString);
        if (newValue !== script) {
          scriptUpdates.push({
            campaign: { id: step.campaign_id },
            found: script,
            replaced: newValue,
            target: "interactionStep"
          });
          await r
            .knex("interaction_step")
            .transacting(trx)
            .update({ script: newValue })
            .where({ id: step.id });
        }
      }
    }
    if (targetObject.indexOf("cannedResponse") >= 0) {
      const cannedResponseCampaigns = new Set();
      const cannedResponsesToChange = await r
        .knex("canned_response")
        .transacting(trx)
        .select(["id", "campaign_id", "text"])
        .whereRaw("text like ?", [`%${searchString}%`])
        .whereIn("campaign_id", campaignIds);

      for (const response of cannedResponsesToChange) {
        const text = response.text;
        const newValue = replaceAll(text, searchString, replaceString);
        if (newValue !== text) {
          scriptUpdates.push({
            campaign: { id: response.campaign_id },
            found: text,
            replaced: newValue,
            target: "cannedResponse"
          });
          await r
            .knex("canned_response")
            .transacting(trx)
            .update({ text: newValue })
            .where({ id: response.id });
        }
        cannedResponseCampaigns.add(response.campaign_id);
      }
      await Promise.all(
        cannedResponseCampaigns.values().map(campaignId =>
          cacheableData.cannedResponse.clearQuery({
            userId: "",
            campaignId
          })
        )
      );
    }
    // clear campaign_id caches
    await Promise.all(
      campaignIds.map(cid => cacheableData.campaign.clear(cid))
    );

    return scriptUpdates;
  });

  return scriptUpdatesResult;
};
