/* eslint-disable no-empty-function */
import { r } from "../../server/models";
import { available as loaderAvailable } from "../contact-loaders/gvirs";
// import { searchTags, addContactToTag } from "../contact-loaders/civicrm/util";
import { getConfig } from "../../server/api/lib/config";
import {
  GVIRS_CACHE_SECONDS,
  ENVIRONMENTAL_VARIABLES_MANDATORY,
  GVIRS_CONTACT_LOADER,
  GVIRS_ACTION_HANDLER_REPORTWRONGNUMBER
} from "../contact-loaders/gvirs/const";

export const name = GVIRS_ACTION_HANDLER_REPORTWRONGNUMBER;

// What the user sees as the option
export const displayName = () => "Report a wrong number for a voter";

// The Help text for the user after selecting the action
export const instructions = () =>
  "If the interaction indicates a wrong number, select this action.";

export function serverAdministratorInstructions() {
  return {
    description: `
      This action is for allowing texters to record wrong numbers for voters.
      `,
    setupInstructions: `
      1. Add "gvirs-reportwrongnumber" to the environment variable "ACTION_HANDLERS";
      2. Set up Spoke to use the existing gVIRS contact loader.
      `,
    environmentVariables: [...ENVIRONMENTAL_VARIABLES_MANDATORY]
  };
}

// return true, if the action is usable and available for the organizationId
// Sometimes this means certain variables/credentials must be setup
// either in environment variables or organization.features json data
// Besides this returning true, "civicrm-addtag" will also need to be added to
// process.env.ACTION_HANDLERS
export async function available(organization) {
  const contactLoadersConfig = getConfig("CONTACT_LOADERS").split(",");
  if (contactLoadersConfig.indexOf(GVIRS_CONTACT_LOADER) !== -1) {
    const hasLoader = await loaderAvailable(organization, 0);
    return hasLoader;
  }
  return { result: false, expiresSeconds: GVIRS_CACHE_SECONDS };
}

// What happens when a texter saves the answer that triggers the action
// This is presumably the meat of the action
export async function processAction({
  interactionStep,
  campaignContactId,
  contact
}) {
  // This is a meta action that updates a variable in the contact record itself.
  // Generally, you want to send action data to the outside world, so you
  // might want the request library loaded above

  // const gvirsContactId = contact.external_id;
  // const destinationInteraction = JSON.parse(interactionStep.answer_actions_data)
  //   .value;

  //  await setMeaningFul(gvirsContactId, destinationInteraction);

  const customFields = JSON.parse(contact.custom_fields || "{}");
  customFields.processed_test_action = (interactionStep || {}).answer_actions;
  customFields.test_action_details = (
    interactionStep || {}
  ).answer_actions_data;

  await r
    .knex("campaign_contact")
    .where("campaign_contact.id", campaignContactId)
    .update("custom_fields", JSON.stringify(customFields));
}

// What happens when a texter remotes an answer that triggers the action
// eslint-disable-next-line no-unused-vars
export async function processDeletedQuestionResponse(options) {}
