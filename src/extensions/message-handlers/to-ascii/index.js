import { getConfig } from "../../../server/api/lib/config";
import { r, cacheableData, Message } from "../../../server/models";
import serviceMap from "../../../server/api/lib/services";

export const serverAdministratorInstructions = () => {
  return {
    description: `
       If initial texts deviate from the original script then automatically
       unassign the rest of the contacts and set max_contacts=0 for that
       campaign.

       VETTED_TEXTERs and above will not be blocked in the same way.
    `,
    setupInstructions: `Just enable it -- only works when caching is on`,
    environmentVariables: []
  };
};

// note this is NOT async
export const available = organization => {
  // without caching
  return Boolean(r.redis);
};

// export const preMessageSave = async () => {};

export const preMessageSave = async ({ messageToSave }) => {
  if (!messageToSave.is_from_contact && messageToSave.text) {
    messageToSave.text = messageToSave.text
      .replace(/—/g, "--")
      .replace(/‘|’/g, "'")
      .replace(/“|”|„/g, '"');
    return {
      messageToSave,
      context: { messageAltered: true }
    };
  }
};
