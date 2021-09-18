import { r } from "../../models";
import { getConfig } from "./config";
import usAreaCodes from "us-area-codes/data/codes.json";

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
  const nums = await r
    .knex("owned_phone_number")
    .select("area_code", r.knex.raw("count(*) as count"))
    .where({
      allocated_to: "campaign",
      allocated_to_id: campaignId.toString()
    })
    .groupBy("area_code");
  return nums.map(n => ({
    area_code: n.area_code,
    count: Number(n.count)
  }));
}

async function listOrganizationCounts(organization) {
  const service =
    getConfig("service", organization) ||
    getConfig("DEFAULT_SERVICE", organization);
  const counts = await r
    .knex("owned_phone_number")
    .select(
      "area_code",
      r.knex.raw("COUNT(allocated_to) as allocated_count"),
      r.knex.raw(
        "SUM(CASE WHEN allocated_to IS NULL THEN 1 END) as available_count"
      )
    )
    .where({
      service,
      organization_id: organization.id
    })
    .groupBy("area_code");
  return counts.map(row => ({
    areaCode: row.area_code,
    state: usAreaCodes[row.area_code] || "N/A",
    allocatedCount: Number(row.allocated_count),
    availableCount: Number(row.available_count)
  }));
}

export default {
  allocateCampaignNumbers,
  releaseCampaignNumbers,
  listCampaignNumbers,
  listOrganizationCounts
};
