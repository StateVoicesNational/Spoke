import request from "request";
import { r } from "../../server/models";

export const name = "complex-test-action";

// What the user sees as the option
export const displayName = () => "Complex Test Action";

// The Help text for the user after selecting the action
export const instructions = () =>
  `
  This action is for testing and as a code-template for new actions.
  `;

export function clientChoiceDataCacheKey(organization, user, loaders) {
  return `${organization.id}`;
}

// return true, if the action is usable and available for the organizationId
// Sometimes this means certain variables/credentials must be setup
// either in environment variables or organization.features json data
// Besides this returning true, "test-action" will also need to be added to
// process.env.ACTION_HANDLERS
export async function available(organizationId) {
  return {
    result: true,
    expiresSeconds: 600
  };
}

// What happens when a texter saves the answer that triggers the action
// This is presumably the meat of the action
export async function processAction(
  questionResponse,
  interactionStep,
  campaignContactId
) {
  // This is a meta action that updates a variable in the contact record itself.
  // Generally, you want to send action data to the outside world, so you
  // might want the request library loaded above
  const contact = await r
    .knex("campaign_contact")
    .where("campaign_contact_id", campaignContactId);
  const customFields = JSON.parse(contact.custom_fields || "{}");
  if (customFields) {
    customFields["processed_test_action"] = "completed";
    customFields["test_action_details"] = "completed";
  }

  await r
    .knex("campaign_contact")
    .where("campaign_contact.id", campaignContactId)
    .update("custom_fields", JSON.stringify(customFields));
}

export async function getClientChoiceData(organization, user) {
  const items = [
    {
      name: "firebrick",
      details: JSON.stringify({
        hex: "#B22222",
        rgb: {
          r: 178,
          g: 34,
          b: 34
        }
      })
    },
    {
      name: "indigo",
      details: JSON.stringify({
        hex: "#4B0082",
        rgb: {
          r: 75,
          g: 0,
          b: 130
        }
      })
    }
  ];
  return {
    data: `${JSON.stringify({ items })}`,
    expiresSeconds: 300
  };
}
