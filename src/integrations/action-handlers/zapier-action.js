import { getConfig } from "../../server/api/lib/config";
import { log } from "../../lib";

import httpRequest from "../../server/lib/http-request.js";

export const name = "zapier-action";

// What the user sees as the option
export const displayName = () => "ZAPIER";

// The Help text for the user after selecting the action
export const instructions = () =>
  `
  This action is for reporting the results of interactions with contacts via ZAPIER
  `;

export function serverAdministratorInstructions() {
  return {
    description:
      "This action is for reporting the results of interactions with contacts via ZAPIER",
    setupInstructions: "Set ZAPIER_WEBHOOK_URL to your zapier webhook URL.",
    environmentVariables: ["ZAPIER_WEBHOOK_URL", "BASE_URL"]
  };
}

export function clientChoiceDataCacheKey(organization) {
  return `${organization.id}`;
}

export async function onTagUpdate(
  tags,
  contact,
  campaign,
  organization,
  texter
) {
  const baseUrl = getConfig("BASE_URL", organization);
  const conversationLink = `${baseUrl}/app/${organization.id}/todos/review/${contact.id}`;

  const payload = {
    texter: {
      name: `${texter.first_name} ${texter.last_name}`,
      email: texter.email
    },
    campaign: {
      id: campaign.id,
      title: campaign.title
    },
    conversation: conversationLink,
    tags: tags.map(tag => tag.name)
  };

  const stringifiedPayload = JSON.stringify(payload);

  const url = getConfig("ZAPIER_WEBHOOK_URL", organization);

  console.info(`Zapier onTagUpdate sending ${stringifiedPayload} to ${url}`);

  return httpRequest(url, {
    method: "POST",
    retries: 0,
    timeout: 5000,
    headers: {
      "Content-Type": "application/json"
    },
    body: stringifiedPayload,
    validStatuses: [200],
    compress: false
  });
}

// What happens when a texter saves the answer that triggers the action
// This is presumably the meat of the action
export async function processAction() {
  // unusedQuestionResponse,
  // interactionStep,
  // unusedCampaignContactId,
  // contact,
  // unusedCampaign,
  // organization
  try {
    throw new Error("zapier-action.processAction is not implemented");
  } catch (caughtError) {
    log.error("Encountered exception in zapier.processAction", caughtError);
    throw caughtError;
  }
}

// return true, if the action is usable and available for the organizationId
// Sometimes this means certain variables/credentials must be setup
// either in environment variables or organization.features json data
// Besides this returning true, "test-action" will also need to be added to
// process.env.ACTION_HANDLERS
export async function available(organization) {
  const result =
    !!getConfig("ZAPIER_WEBHOOK_URL", organization) &&
    !!getConfig("BASE_URL", organization);

  if (!result) {
    log.info(
      "zapier-action unavailable. Missing one or more of the required environment variables"
    );
  }

  return {
    result,
    expiresSeconds: 0
  };
}
