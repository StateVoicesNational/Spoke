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
      .knex("organization_contact")
      .where({
        organization_id: organizationId,
        contact_number: contactNumber
      })
      .first();

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

    if (r.redis) {
      const cacheKey = getCacheKey(organizationId, contactNumber);

      await r.redis
        .multi()
        .set(cacheKey, JSON.stringify(organizationContact))
        .expire(cacheKey, 43200) // 12 hours
        .execAsync();
    }
  }
};

export default organizationContactCache;
