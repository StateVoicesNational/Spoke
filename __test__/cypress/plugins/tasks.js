import AuthHasher from "passport-local-authenticate";
import { r, createTables, truncateTables } from "../../../src/server/models/";
import {
  createUser,
  createInvite,
  createOrganization
} from "../../test_helpers";

/**
 * Make Cypress tasks with access to the config.
 *
 * https://docs.cypress.io/api/commands/task.html#Syntax
 */
export function defineTasks(on, config) {
  on("task", {
    async resetDB() {
      await createTables();
      await truncateTables();
      return null;
    },

    async createOrganization() {
      const admin = await createUser();
      const invite = await createInvite();
      const organizationResult = await createOrganization(admin, invite);
      const org = organizationResult.data.createOrganization;
      await r
        .knex("organization")
        .where({ id: org.id })
        .update({
          features: JSON.stringify({ EXPERIMENTAL_PHONE_INVENTORY: true })
        });
      return org;
    },

    async createUser({ userInfo, org, role }) {
      const user = await new Promise((resolve, reject) => {
        AuthHasher.hash(userInfo.password, async (err, hashed) => {
          if (err) reject(err);
          const hashedPassword = `localauth|${hashed.salt}|${hashed.hash}`;
          const u = await createUser(
            {
              ...userInfo,
              auth0_id: hashedPassword
            },
            org ? org.id : null,
            role
          );
          resolve(u);
        });
      });
      return user;
    }
  });

  return config;
}
