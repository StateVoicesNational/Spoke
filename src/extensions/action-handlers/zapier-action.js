import { getConfig } from "../../server/api/lib/config";
import { log } from "../../lib";

import httpRequest from "../../server/lib/http-request.js";

export const name = "zapier-action";

// What the user sees as the option
export const displayName = () => "ZAPIER";

// The Help text for the user after selecting the action
export const instructions = () =>
  `
  This action is for reporting the results of interactions with contacts via ZAPIER (or any other HTTP endpoint)
  `;

export function serverAdministratorInstructions() {
  return {
    description:
      "This action is for reporting the results of interactions with contacts via ZAPIER (or any other HTTP endpoint)",
    setupInstructions:
      "Set ZAPIER_WEBHOOK_URL to your zapier webhook URL (or other HTTP endpoint) for processing tag actions. Set ZAPIER_ACTION_URL to your zapier webhook URL (or other HTTP endpoint) for processing question-response actions. Also see documentation on ZAPIER_CONFIG_OBJECT for setting per-response URLs.",
    environmentVariables: [
      "ZAPIER_WEBHOOK_URL",
      "BASE_URL",
      "ZAPIER_ACTION_URL",
      "ZAPIER_TIMEOUT_MS",
      "ZAPIER_CONFIG_OBJECT"
    ]
  };
}

export function clientChoiceDataCacheKey() {
  return "";
}

export async function onTagUpdate(
  tags,
  contact,
  campaign,
  organization,
  texter
) {
  const url = getConfig("ZAPIER_WEBHOOK_URL", organization);
  if (!url) {
    log.info("ZAPIER_WEBHOOK_URL is undefined. Exiting.");
    return;
  }

  log.info(`tags: ${JSON.stringify(tags)}`);
  log.info(`contact: ${JSON.stringify(contact)}`);
  log.info(`campaign: ${JSON.stringify(campaign)}`);
  log.info(`organization: ${JSON.stringify(organization)}`);
  log.info(`texter: ${JSON.stringify(texter)}`);

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
export async function processAction({
  questionResponse,
  interactionStep,
  campaignContactId,
  contact,
  campaign,
  organization,
  previousValue
}) {
  try {
    const url = getConfig("ZAPIER_ACTION_URL", organization);
    if (!url) {
      log.info("ZAPIER_ACTION_URL is undefined. Exiting.");
      return;
    }
    const config = JSON.parse(
      getConfig("ZAPIER_CONFIG_OBJECT", organization) || "{}"
    );
    if (!!config) {
      log.info(
        `ZAPIER_CONFIG_OBJECT is undefined. All payloads will go to ${url}`
      );
    }

    log.info(`questionResponse: ${JSON.stringify(questionResponse)}`);
    log.info(`interactionStep: ${JSON.stringify(interactionStep)}`);
    log.info(`campaignContactId: ${JSON.stringify(campaignContactId)}`);
    log.info(`contact: ${JSON.stringify(contact)}`);
    log.info(`campaign: ${JSON.stringify(campaign)}`);
    log.info(`organization: ${JSON.stringify(organization)}`);
    log.info(`previousValue: ${JSON.stringify(previousValue)}`);

    const baseUrl = getConfig("BASE_URL", organization);
    const conversationLink = `${baseUrl}/app/${organization.id}/todos/review/${contact.id}`;
    const campaignCopy = { ...campaign };
    delete campaignCopy.feature;
    delete campaignCopy.features;
    const payload = {
      questionResponse,
      interactionStep,
      campaignContactId,
      contact,
      campaign: campaignCopy,
      organization,
      previousValue,
      conversationLink
    };

    const stringifiedPayload = JSON.stringify(payload);

    const zap_timeout = getConfig("ZAPIER_TIMEOUT_MS", organization) || 5000;
    log.info(`Zapier timeout: ${zap_timeout}`);

    let final_url = "";
    const answer_option = interactionStep.answer_option;

    if (Object.keys(config).length != 0) {
      if (Array.isArray(config.processAction)) {
        for (let item of config.processAction) {
          if (
            typeof item.answer_name === "string" &&
            typeof item.webhook_url === "string"
          ) {
            if (answer_option === item.answer_name) {
              final_url = item.webhook_url;
            }
          }
        }
        if (final_url === "") {
          log.info(
            `Did not find "${answer_option}" in ZAPIER_CONFIG_OBJECT. Using default URL from ZAPIER_WEBHOOK_URL (${url}).`
          );
          final_url = url;
        }
      } else {
        final_url = url;
      }
    } else {
      final_url = url;
    }

    log.info(`Zapier processAction sending ${answer_option} to ${final_url}`);

    return httpRequest(final_url, {
      method: "POST",
      retries: 0,
      timeout: zap_timeout,
      headers: {
        "Content-Type": "application/json"
      },
      body: stringifiedPayload,
      validStatuses: [200],
      compress: false
    });
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
    (!!getConfig("ZAPIER_ACTION_URL", organization) ||
      !!getConfig("ZAPIER_WEBHOOK_URL", organization)) &&
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
