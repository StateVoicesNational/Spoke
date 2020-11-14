import uuid from "uuid";
import { r, User } from "../../../src/server/models";
import AuthHasher from "passport-local-authenticate";

/**
 * Make Cypress tasks with access to the config.
 *
 * https://docs.cypress.io/api/commands/task.html#Syntax
 */
export function defineTasks(on, config) {
  on("task", {
    async getOrCreateTestOrganization() {
      const defaultOrganizationName = "E2E Test Organization";
      let org = await r
        .knex("organization")
        .where("name", defaultOrganizationName)
        .first();

      if (org) return org;

      await r.knex("organization").insert({
        name: defaultOrganizationName,
        uuid: uuid.v4(),
        features: JSON.stringify({ EXPERIMENTAL_PHONE_INVENTORY: true })
      });

      return await r
        .knex("organization")
        .where("name", defaultOrganizationName)
        .first();
    },

    /**
     * Create a user and add it to the test organization with the specified role.
     */
    async createOrUpdateUser({ userData, org }) {
      let user = await r
        .knex("user")
        .where("email", userData.email)
        .first();

      if (!user) {
        user = await new Promise((resolve, reject) => {
          AuthHasher.hash(userData.password, async (err, hashed) => {
            if (err) reject(err);
            const passwordToSave = `localauth|${hashed.salt}|${hashed.hash}`;
            const { email, first_name, last_name, cell } = userData;
            const u = await User.save({
              email,
              first_name,
              last_name,
              cell,
              auth0_id: passwordToSave,
              is_superadmin: false
            });
            resolve(u);
          });
        });
      }

      const role = await r
        .knex("user_organization")
        .where({
          organization_id: org.id,
          user_id: user.id
        })
        .first();

      if (!role) {
        await r.knex("user_organization").insert({
          user_id: user.id,
          organization_id: org.id,
          role: userData.role
        });
      }

      if (role !== userData.role) {
        await r
          .knex("user_organization")
          .where({ user_id: user.id, organization_id: org.id })
          .update({ role: userData.role });
      }

      return user.id;
    },

    async clearTestOrgPhoneNumbers({ areaCode, org }) {
      await r
        .knex("owned_phone_number")
        .where({
          organization_id: org.id,
          service: "fakeservice",
          area_code: areaCode
        })
        .delete();
      return null;
    }
  });

  return config;
}
