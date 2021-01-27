import { r } from "../../models";

const getCacheKey = (organizationId, contactNumber) =>
  `${process.env.CACHE_PREFIX ||
    ""}organization-contact-${organizationId}-${contactNumber}`;

const organizationContactCache = {
  query: async ({ organizationId, contactNumber }) => {
    const cacheKey = getCacheKey(organizationId, contactNumber);

    if (r.redis) {
      const organizationContact = await r.redis.getAsync(cacheKey);

      if (organizationContact) {
        return JSON.parse(organizationContact);
      }
    }

    const organizationContact = await r
      .table("organization_contact")
      .filter({
        organization_id: organizationId,
        contact_number: contactNumber
      })
      .limit(1)(0)
      .default(null);

    if (r.redis) {
      await r.redis
        .multi()
        .set(cacheKey, JSON.stringify(organizationContact))
        .expire(cacheKey, 43200) // 12 hours
        .execAsync();
    }

    return organizationContact;
  },
  save: async ({ organizationId, contactNumber, userNumber }) => {
    const organizationContact = {
      organization_id: organizationId,
      contact_number: contactNumber,
      user_number: userNumber
    };

    await r.knex("organization_contact").insert(organizationContact);

    await r
      .knex("owned_phone_number")
      .where({ phone_number: userNumber })
      .increment("stuck_contacts", 1);

    if (r.redis) {
      const cacheKey = getCacheKey(organizationId, contactNumber);

      await r.redis
        .multi()
        .set(cacheKey, JSON.stringify(organizationContact))
        .expire(cacheKey, 43200) // 12 hours
        .execAsync();
    }
  },
  remove: async ({ organizationId, contactNumber }) => {
    const [contactUserNumber] = await r
      .knex("contact_user_number")
      .where({
        organization_id: organizationId,
        contact_number: contactNumber
      })
      .returning("*")
      .delete();

    if (contactUserNumber) {
      await r
        .knex("owned_phone_number")
        .where({ phone_number: contactUserNumber.user_number })
        .increment("stuck_contacts", -1);
    }
  }
};

export default organizationContactCache;