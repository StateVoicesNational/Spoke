/* eslint-disable no-empty-function */
import { r } from "../../server/models";
import { available as loaderAvailable } from "../contact-loaders/gvirs";
import { createGvirsContact } from "../contact-loaders/gvirs/util";
import { getConfig } from "../../server/api/lib/config";
import {
  GVIRS_CACHE_SECONDS,
  ENVIRONMENTAL_VARIABLES_MANDATORY,
  GVIRS_CONTACT_LOADER,
  GVIRS_ACTION_HANDLER_CREATEVOTERCONTACT,
  GVIRS_CREATE_CONTACT_CHOICE_DEFINITIONS
} from "../contact-loaders/gvirs/const";

export const name = GVIRS_ACTION_HANDLER_CREATEVOTERCONTACT;

// What the user sees as the option
export const displayName = () =>
  "Creates a contact (or interaction) with a voter";

// The Help text for the user after selecting the action
export const instructions = () =>
  "What type of interaction would you like to record for the voter? Select from the following options.";

export function serverAdministratorInstructions() {
  return {
    description: `
      This action is for allowing texters to record types of interactions for voters in gVIRS.
      `,
    setupInstructions: `
      1. Add "gvirs-createvotercontact" to the environment variable "ACTION_HANDLERS";
      2. Set up Spoke to use the existing gVIRS contact loader.
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
  contact,
  organization
}) {
  // This is a meta action that updates a variable in the contact record itself.
  // Generally, you want to send action data to the outside world, so you
  // might want the request library loaded above

  const gvirsVoterId = contact.external_id;
  const customFields = JSON.parse(contact.custom_fields || "{}");
  const destinationInteraction = JSON.parse(interactionStep.answer_actions_data)
    .value;

  const destinationInteractionParsed = JSON.parse(destinationInteraction);
  const gvirsPhoneNumberId = customFields.gvirs_phone_number_id;
  const gvirsSupportLevel = destinationInteractionParsed.support_level;
  const gvirsContactStatusId = destinationInteractionParsed.contact_status_id;
  const gvirsNotes = destinationInteractionParsed.notes;
  const gvirsContactPurposeId = customFields.gvirs_contact_purpose_id;
  const gvirsCampaignId = customFields.gvirs_campaign_id;
  const gvirsFollowup = customFields.followup;

  await createGvirsContact(
    gvirsVoterId,
    gvirsPhoneNumberId,
    gvirsSupportLevel,
    gvirsContactStatusId,
    gvirsNotes,
    gvirsContactPurposeId,
    gvirsCampaignId,
    organization.name,
    gvirsFollowup
  );

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

const VOTER_SUPPORT_LEVELS_CHOICE_DATA = GVIRS_CREATE_CONTACT_CHOICE_DEFINITIONS.map(
  (value, index) => {
    return {
      name: value.name,
      details: JSON.stringify({
        index,
        support_level: value.support_level,
        contact_status_id: value.contact_status_id,
        notes: value.notes || "[From Spoke]",
        followup: "followup" in value ? value.followup : undefined
      })
    };
  }
);

// eslint-disable-next-line no-unused-vars
export async function getClientChoiceData(organization, user) {
  const items = VOTER_SUPPORT_LEVELS_CHOICE_DATA;
  return {
    data: `${JSON.stringify({ items })}`,
    expiresSeconds: GVIRS_CACHE_SECONDS
  };
}
