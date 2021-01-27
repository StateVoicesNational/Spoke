import { r } from "../../models";
import { getConfig } from "./config";

async function allocateCampaignNumbers(
  { organizationId, campaignId, areaCode, amount },
  transactionOrKnex
) {
  const numbers = await transactionOrKnex("owned_phone_number")
    .select("id")
    .forUpdate()
    .where({
      organization_id: organizationId,
      area_code: areaCode,
      allocated_to: null
    })
    .limit(amount);

  if (numbers.length < amount) {
    throw Error(`Failed to reserve ${amount} numbers for ${areaCode}`);
  }

  return transactionOrKnex("owned_phone_number")
    .whereIn(
      "id",
      numbers.map(r => r.id)
    )
    .update({
      allocated_to: "campaign",
      allocated_to_id: campaignId.toString(),
      allocated_at: r.knex.fn.now()
    });
}

async function releaseCampaignNumbers(campaignId, transactionOrKnex) {
  return transactionOrKnex("owned_phone_number")
    .where({ allocated_to: "campaign", allocated_to_id: campaignId.toString() })
    .update({
      allocated_to: null,
      allocated_to_id: null,
      allocated_at: null
    });
}

async function listCampaignNumbers(campaignId) {
  return r
    .knex("owned_phone_number")
    .select("area_code", r.knex.raw("count(*) as count"))
    .where({
      allocated_to: "campaign",
      allocated_to_id: campaignId.toString()
    })
    .groupBy("area_code");
}

async function getOwnedPhoneNumberForStickySender(organizationId, cell) {
  const areaCode = cell.slice(2, 5);

  const secondaryAreaCodesMap = JSON.parse(getConfig("SECONDARY_AREA_CODES"));
  const secondaryAreaCodes = secondaryAreaCodesMap[areaCode];

  return await r
    .knex("owned_phone_number")
    .select(
      "phone_number",
      r.knex.raw(
        "CASE WHEN stuck_contacts > ? THEN 1 ELSE 0 END AS over_contact_per_phone_number_limit",
        getConfig("CONTACTS_PER_PHONE_NUMBER") || 200
      ),
      r.knex.raw(
        "CASE WHEN area_code = '??' THEN 1 ELSE 0 END AS matching_area_code",
        areaCode
      ),
      r.knex.raw(
        `CASE WHEN area_code IN ('${
          secondaryAreaCodes ? secondaryAreaCodes.join("','") : ""
        }') THEN 1 ELSE 0 END AS matching_secondary_area_code`
      ),
      // Prioritize numbers with 0 - 49 stuck contacts, followed by 50 - 99, etc.
      r.knex.raw("CEILING((stuck_contacts + 1.0) / 50) AS priority_grouping"),
      r.knex.raw("random()")
    )
    .where({
      organization_id: organizationId
    })
    .orderByRaw("2, 3 DESC, 4 DESC, 5, 6")
    .first();
}

export default {
  allocateCampaignNumbers,
  releaseCampaignNumbers,
  listCampaignNumbers,
  getOwnedPhoneNumberForStickySender
};
