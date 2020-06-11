import { r } from "../../models";

// TODO: move to db/models package
// TODO: index allocated_to and allocated_to_id
// TODO: make transaction optional
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
      allocated_at: r.knex.raw("now()")
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

export default {
  allocateCampaignNumbers,
  releaseCampaignNumbers,
  listCampaignNumbers
};
