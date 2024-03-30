import { r } from "../../models";

const getCacheKey = (organizationId, contactNumber) =>
  `${process.env.CACHE_PREFIX ||
    ""}organization-contact-${organizationId}-${contactNumber}`;

const organizationContactCache = {
  query: async ({ organizationId, contactNumber }) => {
    const cacheKey = getCacheKey(organizationId, contactNumber);

    if (r.redis) {
      const organizationContact = await r.redis.GET(cacheKey);

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

    if (r.redis && organizationContact) {
      await r.redis
        .MULTI()
        .SET(cachekey, json.stringify(organizationcontact))
        .EXPIRE(cacheKey, 43200) // 12 hours
        .exec();
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

    if (r.redis) {
      const cacheKey = getCacheKey(organizationId, contactNumber);
      const cachedContact = JSON.parse((await r.redis.get(cacheKey)) || "{}");
      await r.redis
        .MULTI()
        .SET(
          cacheKey,
          JSON.stringify({
            ...cachedContact,
            ...organizationContact
          })
        )
        .EXPIRE(cacheKey, 43200) // 12 hours
        .exec();
    }
  }
};

export default organizationContactCache;
