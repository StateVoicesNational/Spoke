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

    //log.info(`questionResponse: ${questionResponse}`);
    //log.info(`interactionStep: ${interactionStep}`);
    //log.info(`campaignContactId: ${campaignContactId}`);
    //log.info(`contact: ${contact}`);
    //log.info(`campaign: ${campaign}`);
    //log.info(`organization: ${organization}`);
    //log.info(`previousValue: ${previousValue}`);

    const baseUrl = getConfig("BASE_URL", organization);
    const conversationLink = `${baseUrl}/app/${organization.id}/todos/review/${contact.id}`;
    const payload = {
      questionResponse: questionResponse,
      interactionStep: interactionStep,
      campaignContactId: campaignContactId,
      contact: contact,
      campaign: campaign,
      organization: organization,
      previousValue: previousValue,
      conversationLink: conversationLink
    };

    const stringifiedPayload = JSON.stringify(payload);

    const url = getConfig("ZAPIER_WEBHOOK_URL", organization);
    const zap_timeout = getConfig("ZAPIER_TIMEOUT_MS", organization) || 5000;
    log.info(`Zapier timeout: ${zap_timeout}`);

    //var dynamic_url = "";
    var final_url = "";
    const answer_option = interactionStep.answer_option;

    const config = JSON.parse(getConfig("ZAPIER_CONFIG_OBJECT", organization)) || {};

    if(Object.keys(config).length != 0) {
      if(Array.isArray(config.processAction)) {
        for(let item of config.processAction) {
          if( typeof item.answer_name === 'string' && typeof item.webhook_url === 'string') {
            if(answer_option === item.answer_name) {
              final_url = item.webhook_url;
            }
	  }
	}
        if(final_url === "") {
          log.info(`Did not find "${answer_option}" in ZAPIER_CONFIG_OBJECT. Using default URL from ZAPIER_WEBHOOK_URL.`);
          final_url = url;
	}
      } else {
        final_url = url;
      }
      
    }
    else {
      final_url = url;
    }

    /*
    switch(answer_option) {
      case "Yes 1 - Strong support of slate": dynamic_url = "https://hooks.zapier.com/hooks/catch/9728183/ovdvp40/"; break;
      case "Yes 2 - Lean support of slate": dynamic_url = "https://hooks.zapier.com/hooks/catch/9728183/ovmyh4f/"; break;
      case "Neutral 3 - undecided": dynamic_url = "https://hooks.zapier.com/hooks/catch/9728183/ovmy9dp/"; break;
      case "No 4 - Lean against the slate": dynamic_url = "https://hooks.zapier.com/hooks/catch/9728183/ovmy5sy/"; break;
      case "No 5 - Strong against the slate": dynamic_url = "https://hooks.zapier.com/hooks/catch/9728183/ovmyrd7/"; break;
      case "Other (wrong number, moved, etc)": dynamic_url = "https://hooks.zapier.com/hooks/catch/9728183/ovmysaf/"; break;
      case "Persuade - Successful": dynamic_url = "https://hooks.zapier.com/hooks/catch/9728183/ovmy89n/"; break;
      case "Persuade - Failed": dynamic_url = "https://hooks.zapier.com/hooks/catch/9728183/ovmykdc/"; break;
      case "Voting - Early": dynamic_url = "https://hooks.zapier.com/hooks/catch/9728183/ovmywmu/"; break;
      case "Voting - Election Day": dynamic_url = "https://hooks.zapier.com/hooks/catch/9728183/ovmygxg/"; break;
      case "Voting - Other (mail, absentee, etc)": dynamic_url = "https://hooks.zapier.com/hooks/catch/9728183/ovmylz1/"; break;
      case "Volunteer - Yes": dynamic_url = "https://hooks.zapier.com/hooks/catch/9728183/ovmye0c/"; break;
      case "Volunteer - No": dynamic_url = "https://hooks.zapier.com/hooks/catch/9728183/ovmy0d4/"; break;
      case "Vote Triple - Yes": dynamic_url = "https://hooks.zapier.com/hooks/catch/9728183/ovmyxqq/"; break;
      case "Vote Triple - No": dynamic_url = "https://hooks.zapier.com/hooks/catch/9728183/ovmyn3c/"; break;
      default: dynamic_url = url;
    }
    */

    //console.info(`Zapier processAction sending ${answer_option} to ${dynamic_url}`);
    console.info(`Zapier processAction sending ${answer_option} to ${final_url}`);


    //return httpRequest(dynamic_url, {
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
