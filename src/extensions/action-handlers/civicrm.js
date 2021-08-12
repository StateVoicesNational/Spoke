import { parse } from "url";
import { getConfig } from "../../server/api/lib/config";
import request from "request";
import { r } from "../../server/models";

export const name = "civicrm";

// What the user sees as the option
export const displayName = () => "CiviCRM";

// The Help text for the user after selecting the action
export const instructions = () =>
  `
   This action is for reporting the results of interactions with contacts via CiviCRM
  `;

export function serverAdministratorInstructions() {
  return {
    description: `
      This action is for reporting the results of interactions with contacts via ZAPIER
      `,
    setupInstructions:
      "Add CIVICRM_API_KEY, CIVICRM_SITE_KEY, CIVICRM_DOMAIN to the environment variable",
    environmentVariables: [
      "CIVICRM_API_KEY",
      "CIVICRM_SITE_KEY",
      "CIVICRM_DOMAIN"
    ]
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

function getCivi() {
  const domain = parse(getConfig("CIVICRM_DOMAIN"));

  const config = {
    server: domain.protocol + "//" + domain.host,
    path: domain.pathname,
    debug: 1,
    key: getConfig("CIVICRM_SITE_KEY"),
    api_key: getConfig("CIVICRM_API_KEY")
  };

  return config;
}

async function post(config, entity, action, options) {
  const url =
    config.server +
    config.path +
    "?key=" +
    config.key +
    "&api_key=" +
    config.api_key +
    "&entity=" +
    entity +
    "&action=" +
    action +
    "&json=" +
    JSON.stringify(options);

  try {
    const result = await fetch(url, {
      method: "POST"
    });
    const json = await result.json();
    if (json.is_error) {
      return json.error_message;
    } else {
      return json.values;
    }
  } catch (error) {
    return error;
  }
}

// What happens when a texter saves the answer that triggers the action
// This is presumably the meat of the action
export async function processAction({
  campaignContactId,
  contact,
  interactionStep
}) {
  const action_data = JSON.parse(interactionStep.answer_actions_data);
  const coustom_field = JSON.parse(contact.custom_fields);
  const config = getCivi();

  switch (action_data["value"]) {
    case "do_not_sms":
      let json = {
        sequential: 1,
        contact_type: coustom_field["contact_type"],
        do_not_sms: 1,
        id: contact["external_id"]
      };

      return await post(config, "Contact", "create", json);
      break;
  }
}

export async function getClientChoiceData(organization, user) {
  const items = [
    {
      name: "Do Not SMS",
      details: "do_not_sms"
    }
  ];

  return {
    data: `${JSON.stringify({ items })}`,
    expiresSeconds: 0
  };
}
