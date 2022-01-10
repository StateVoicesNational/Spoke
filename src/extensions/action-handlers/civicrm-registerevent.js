/* eslint-disable no-empty-function */
import { r } from "../../server/models";
import { available as loaderAvailable } from "../contact-loaders/civicrm";
import {
  searchEvents,
  registerContactForEvent
} from "../contact-loaders/civicrm/util";
import { getCacheLength } from "../contact-loaders/civicrm/getcachelength";
import { getConfig } from "../../server/api/lib/config";
import {
  ENVIRONMENTAL_VARIABLES_MANDATORY,
  CIVICRM_CONTACT_LOADER,
  CIVICRM_ACTION_HANDLER_REGISTEREVENT
} from "../contact-loaders/civicrm/const";

export const name = CIVICRM_ACTION_HANDLER_REGISTEREVENT;

// What the user sees as the option
export const displayName = () => "Register contact for CiviCRM event";

// The Help text for the user after selecting the action
export const instructions = () =>
  "What CiviCRM event would you like to register the contact for? Select from the following options.";

export function serverAdministratorInstructions() {
  return {
    description: `
      This action is for allowing texters to register contacts for CiviCRM events.
      `,
    setupInstructions: `
      1. Add "civicrm-registerevent" to the environment variable "ACTION_HANDLERS"; and
      2. Set up Spoke to use the existing civicrm contact loader.
      `,
    environmentVariables: [...ENVIRONMENTAL_VARIABLES_MANDATORY]
  };
}

// eslint-disable-next-line no-unused-vars
export function clientChoiceDataCacheKey(organization, user) {
  return `${organization.id}`;
}

// return true, if the action is usable and available for the organizationId
// Sometimes this means certain variables/credentials must be setup
// either in environment variables or organization.features json data
// Besides this returning true, "civicrm-registerevent" will also need to be added to
// process.env.ACTION_HANDLERS
export async function available(organizationId) {
  const contactLoadersConfig = getConfig("CONTACT_LOADERS").split(",");
  if (contactLoadersConfig.indexOf(CIVICRM_CONTACT_LOADER) !== -1) {
    const hasLoader = await loaderAvailable(organizationId, 0);
    return {
      result: hasLoader.result,
      expiresSeconds: getCacheLength(CIVICRM_ACTION_HANDLER_REGISTEREVENT)
    };
  }
  return {
    result: false,
    expiresSeconds: getCacheLength(CIVICRM_ACTION_HANDLER_REGISTEREVENT)
  };
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

  const civiContactId = contact.external_id;
  const answerData = JSON.parse(interactionStep.answer_actions_data);
  const civiEventId = JSON.parse(answerData.value).id;
  const civiRoleId = JSON.parse(answerData.value).role_id;

  await registerContactForEvent(civiContactId, civiEventId, civiRoleId);

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

// eslint-disable-next-line no-unused-vars
export async function getClientChoiceData(organization, user) {
  const getEventData = await searchEvents();
  const items = getEventData.map(item => {
    return {
      name: `${item.title} (${item.start_date.substring(
        0,
        item.start_date.indexOf(" ")
      )})`,
      details: JSON.stringify({ id: item.id, role_id: item.default_role_id })
    };
  });
  return {
    data: `${JSON.stringify({ items })}`,
    expiresSeconds: getCacheLength(CIVICRM_ACTION_HANDLER_REGISTEREVENT)
  };
}
