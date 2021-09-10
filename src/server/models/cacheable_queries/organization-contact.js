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
  save: async (organizationContact, options) => {
    const organizationId = organizationContact.organization_id;
    const contactNumber = organizationContact.contact_number;

    if (options && options.update) {
      await r
        .knex("organization_contact")
        .where({
          organization_id: organizationId,
          contact_number: contactNumber
        })
        .update(organizationContact);
    } else {
      await r.knex("organization_contact").insert(organizationContact);
    }

    await r
      .knex("owned_phone_number")
      .where({ phone_number: userNumber })
      .increment("stuck_contacts", 1);

    if (r.redis) {
      const cacheKey = getCacheKey(organizationId, contactNumber);
      const cachedContact = JSON.parse(
        (await r.redis.getAsync(cacheKey)) || "{}"
      );
      await r.redis
        .multi()
        .set(
          cacheKey,
          JSON.stringify({
            ...cachedContact,
            ...organizationContact
          })
        )
        .expire(cacheKey, 43200) // 12 hours
        .execAsync();
    }
  },
  remove: async ({ organizationId, contactNumber }) => {
    const [organizationContact] = await r
      .knex("organization_contact")
      .where({
        organization_id: organizationId,
        contact_number: contactNumber
      })
      .limit(1);

    await r
      .knex("organization_contact")
      .where({
        organization_id: organizationId,
        contact_number: contactNumber
      })
      .delete();

    if (organizationContact) {
      await r
        .knex("owned_phone_number")
        .where({ phone_number: organizationContact.user_number })
        .increment("stuck_contacts", -1);
    }
  }
};

export default organizationContactCache;
