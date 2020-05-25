import { r, User } from "../../../src/server/models";
import AuthHasher from "passport-local-authenticate";

/**
 * Make Cypress tasks with access to the config.
 *
 * https://docs.cypress.io/api/commands/task.html#Syntax
 */
export function makeTasks(config) {
  return {
    /**
     * Create a user and add it to the test organization with the specified role.
     */
    createOrUpdateUser: async userData => {
      let user = await r
        .knex("user")
        .where("email", userData.email)
        .first();

      if (!user) {
        // TODO[matteosb]: support Auth0 and consider creating users through
        // the API rather than with direct database access, which would be
        // better when running against remote envs. Alternatively, we could
        // simply not support user creation when running against a remove
        // env, similar to SUPPRESS_ORG_CREATION.
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
          organization_id: config.env.TEST_ORGANIZATION_ID,
          user_id: user.id
        })
        .first();

      if (!role) {
        await r.knex("user_organization").insert({
          user_id: user.id,
          organization_id: config.env.TEST_ORGANIZATION_ID,
          role: userData.role
        });
      }

      if (role !== userData.role) {
        await r
          .knex("user_organization")
          .where({ organization_id: config.env.TEST_ORGANIZATION_ID })
          .update({ role: userData.role });
      }

      return user.id;
    },

    clearTestOrgPhoneNumbers: async areaCode => {
      await r
        .knex("owned_phone_number")
        .where({
          organization_id: config.env.TEST_ORGANIZATION_ID,
          service: "fakeservice",
          area_code: areaCode
        })
        .delete();
      return null;
    }
  };
}
