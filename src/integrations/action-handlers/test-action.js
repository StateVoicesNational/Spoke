import request from "request";
import { r } from "../../server/models";

export const name = "test-action";

// What the user sees as the option
export const displayName = () => "Test Action";

// The Help text for the user after selecting the action
export const instructions = () =>
  `
  This action is for testing and as a code-template for new actions.
  `;

export function serverAdministratorInstructions() {
  return {
    description: `
      This action is for testing and as a code-template for new actions.
      `,
    setupInstructions:
      "Add `test-action` to the environment variable `ACTION_HANDLERS`",
    environmentVariables: []
  };
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
  campaignContactId,
  contact
  // campaign,    // unused parameter
  // organization // unused parameter
) {
  // This is a meta action that updates a variable in the contact record itself.
  // Generally, you want to send action data to the outside world, so you
  // might want the request library loaded above
  const customFields = JSON.parse(contact.custom_fields || "{}");
  if (customFields) {
    customFields["processed_test_action"] = "completed";
  }

  await r
    .knex("campaign_contact")
    .where("campaign_contact.id", campaignContactId)
    .update("custom_fields", JSON.stringify(customFields));
}

// Uncomment to test tag action handlers
// TODO: move this to tag handlers
// export async function onTagUpdate(
//   tags,
//   contact,
//   campaign,
//   organization,
//   texter
// ) {
//   console.log("TEST TAG HANDLER", {tags, contact, campaign, organization, texter});
// }
