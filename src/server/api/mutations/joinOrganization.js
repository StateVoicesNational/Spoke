import { GraphQLError } from "graphql";

import { r, cacheableData } from "../../models";
import { hasRole } from "../../../lib";
import { getConfig } from "../lib/config";
import telemetry from "../../telemetry";

const INVALID_JOIN = () => {
  const error = new GraphQLError("Invalid join request");
  error.code = "INVALID_JOIN";
  return error;
};

export const joinOrganization = async (
  _,
  { organizationUuid, campaignId, queryParams },
  { user }
) => {
  let organization;
  let campaign;
  let userOrg;
  if (campaignId) {
    campaign = await r
      .knex("campaign")
      .where({
        id: campaignId,
        join_token: organizationUuid,
        use_dynamic_assignment: true,
        is_started: true
      })
      .first();
    if (campaign) {
      organization = await cacheableData.organization.load(
        campaign.organization_id
      );
      const maxTextersPerCampaign = getConfig(
        "MAX_TEXTERS_PER_CAMPAIGN",
        organization
      );
      if (maxTextersPerCampaign) {
        const campaignTexterCount = await r.getCount(
          r.knex("assignment").where("campaign_id", campaignId)
        );
        if (campaignTexterCount >= maxTextersPerCampaign) {
          const error = new GraphQLError(
            "Sorry, this campaign has too many texters already"
          );
          error.code = "FAILEDJOIN_TOOMANYTEXTERS";
          throw error;
        }
      }
    } else {
      throw INVALID_JOIN();
    }
  } else {
    organization = await r
      .knex("organization")
      .where("uuid", organizationUuid)
      .first();
  }
  if (!organization) {
    throw INVALID_JOIN();
  }
  userOrg = await r
    .knex("user_organization")
    .where({
      user_id: user.id,
      organization_id: organization.id
    })
    .select("role")
    .first();
  if (!userOrg) {
    if (
      campaign &&
      getConfig("CAMPAIGN_INVITES_CURRENT_USERS_ONLY", organization)
    ) {
      // only organization joins are valid with this setting
      throw INVALID_JOIN();
    }
    try {
      await r.knex("user_organization").insert({
        user_id: user.id,
        organization_id: organization.id,
        role: "TEXTER"
      });
      await telemetry.reportEvent("User Join Organization", {
        count: 1,
        organizationId: organization.id
      });
    } catch (error) {
      // Unexpected errors
      console.log("error on userOrganization save", error);
      throw new GraphQLError("Error on saving user-organization connection");
    }
    await cacheableData.user.clearUser(user.id);
  }
  if (campaign && (!userOrg || hasRole("TEXTER", [userOrg.role]))) {
    const assignment = await r
      .knex("assignment")
      .where({
        campaign_id: campaign.id,
        user_id: user.id
      })
      .first();
    if (!assignment) {
      const maxContacts = getConfig("MAX_CONTACTS_PER_TEXTER", organization);
      await r.knex("assignment").insert({
        user_id: user.id,
        campaign_id: campaign.id,
        max_contacts: maxContacts ? Number(maxContacts) : null
      });
      await telemetry.reportEvent("User Join Assignment", {
        count: 1,
        campaignId: campaign.id,
        organizationId: organization.id
      });
    }
  }
  return organization;
};
