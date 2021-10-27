/* eslint-disable no-empty-function */
import { r } from "../../server/models";
import {
  available as loaderAvailable,
  ENVIRONMENTAL_VARIABLES_MANDATORY,
  name as loaderName
} from "../contact-loaders/civicrm";
import {
  sendEmailToContact,
  searchMessageTemplates,
  getIntegerArray
} from "../contact-loaders/civicrm/util";
import { getConfig, hasConfig } from "../../server/api/lib/config";
import { log } from "../../lib/log";
import { CIVICRM_CACHE_SECONDS } from "../contact-loaders/civicrm/const";

export const name = "civicrm-sendemail";

// What the user sees as the option
export const displayName = () => "Send email to contact";

// The Help text for the user after selecting the action
export const instructions = () =>
  "Selecting this action means that the user receives a email (using a template chosen by the texter).";

export function serverAdministratorInstructions() {
  return {
    description: `
      This action is for texter to choose a template to send an email to contact.
      `,
    setupInstructions: `
      1. Add "civicrm-sendemail" to the environment variable "ACTION_HANDLERS";
      2. Set up Spoke to use the existing civicrm contact loader.
      3. Set the "CIVICRM_MESSAGE_IDS" environmental variable to contain a
         comma-separated list of mailing templates. 
      `,
    environmentVariables: [
      ...ENVIRONMENTAL_VARIABLES_MANDATORY,
      "CIVICRM_MESSAGE_IDS"
    ]
  };
}

// eslint-disable-next-line no-unused-vars
export function clientChoiceDataCacheKey(organization, user) {
  return `${organization.id}`;
}

// return true, if the action is usable and available for the organizationId
// Sometimes this means certain variables/credentials must be setup
// either in environment variables or organization.features json data
// Besides this returning true, "civicrm-sendemail" will also need to be added to
// process.env.ACTION_HANDLERS
export async function available(organizationId) {
  const contactLoadersConfig = getConfig("CONTACT_LOADERS").split(",");
  const hasMessageIds = hasConfig("CIVICRM_MESSAGE_IDS");
  if (
    contactLoadersConfig.indexOf(loaderName) !== -1 &&
    hasMessageIds &&
    getIntegerArray(getConfig("CIVICRM_MESSAGE_IDS")).length !== 0
  ) {
    const hasLoader = await loaderAvailable(organizationId, 0);
    return hasLoader;
  }
  return { result: false, expiresSeconds: CIVICRM_CACHE_SECONDS };
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
  const destinationTemplateId = JSON.parse(interactionStep.answer_actions_data)
    .value;
  log.debug(civiContactId);
  log.debug(destinationTemplateId);
  const addConstantResult = await sendEmailToContact(
    civiContactId,
    destinationTemplateId
  );
  log.debug(addConstantResult);
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
  const getMessageTemplateData = await searchMessageTemplates();
  log.debug(getMessageTemplateData);
  const items = getMessageTemplateData.map(item => {
    return { name: item.msg_title, details: item.id };
  });
  return {
    data: `${JSON.stringify({ items })}`,
    expiresSeconds: CIVICRM_CACHE_SECONDS
  };
}
