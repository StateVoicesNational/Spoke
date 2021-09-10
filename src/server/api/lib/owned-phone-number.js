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

async function getOwnedPhoneNumberForStickySender(organizationId, cell) {
  const areaCode = cell.slice(2, 5);

  const { overlay_area_codes, state_area_codes } = await r
    .knex("area_code")
    .where({
      area_code: areaCode
    })
    .first();

  return await r
    .knex("owned_phone_number")
    .select(
      "phone_number",
      r.knex.raw(
        `CASE WHEN area_code IN ('${
          state_area_codes ? state_area_codes.split("/").join("','") : ""
        }') THEN 1 ELSE 0 END AS matching_state_area_code`
      ),
      r.knex.raw(
        "CASE WHEN stuck_contacts > ? THEN 1 ELSE 0 END AS over_contact_per_phone_number_limit",
        getConfig("CONTACTS_PER_PHONE_NUMBER") || 200
      ),
      r.knex.raw(
        "CASE WHEN area_code = '??' THEN 1 ELSE 0 END AS matching_area_code",
        areaCode
      ),
      // Overlay area codes, provided by the NANPA, are area codes used in the same geographic region, normally a large metro area
      r.knex.raw(
        `CASE WHEN area_code IN ('${
          overlay_area_codes ? overlay_area_codes.split("/").join("','") : ""
        }') THEN 1 ELSE 0 END AS matching_overlay_area_code`
      ),
      // Prioritize numbers with 0 - 49 stuck contacts, followed by 50 - 99, etc.
      r.knex.raw("CEILING((stuck_contacts + 1.0) / 50) AS priority_grouping"),
      r.knex.raw("random()")
    )
    .where({
      organization_id: organizationId
    })
    .orderByRaw("2 DESC, 3, 4 DESC, 5 DESC, 6, 7")
    .first();
}

export default {
  allocateCampaignNumbers,
  releaseCampaignNumbers,
  listCampaignNumbers,
  listOrganizationCounts,
  getOwnedPhoneNumberForStickySender
};
