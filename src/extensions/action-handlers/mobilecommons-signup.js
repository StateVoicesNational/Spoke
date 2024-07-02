import request from "request";
import { r } from "../../server/models";
import { actionKitSignup } from "./helper-ak-sync.js";
import { getConfig } from "../../server/api/lib/config";

export const name = "mobilecommons-signup";

// What the user sees as the option
export const displayName = () => "Mobile Commons Signup";

// The Help text for the user after selecting the action
export const instructions = () =>
  "This option triggers a new user request to Upland Mobile Commons when selected.";

export function serverAdministratorInstructions() {
  return {
    description: `
      This option triggers a new user request to Upland Mobile Commons when selected.
      `,
    setupInstructions:
      "Add `mobilecommons-signup` to the environment variable `ACTION_HANDLERS`; refer to `docs/HOWTO_INTEGRATE_WITH_MOBILE_COMMONS.md`",
    environmentVariables: [
      "UMC_PROFILE_URL",
      "UMC_USER",
      "UMC_PW",
      "UMC_OPT_IN_PATH",
      "UMC_FIELDS"
    ]
  };
}

export async function available(organization) {
  const getUMCconfigured =
    getConfig("UMC_PROFILE_URL", organization) &&
    getConfig("UMC_OPT_IN_PATH", organization);
  return {
    result: organization && getUMCconfigured,
    expiresSeconds: 0
  };
}

export async function processAction({
  interactionStep,
  contact,
  organization
}) {
  const createProfileUrl = getConfig("UMC_PROFILE_URL", organization);
  const defaultProfileOptInId = getConfig("UMC_OPT_IN_PATH", organization);
  const umcAuth =
    "Basic " +
    Buffer.from(
      getConfig("UMC_USER", organization) +
        ":" +
        getConfig("UMC_PW", organization)
    ).toString("base64");
  const customFields = JSON.parse(contact.custom_fields);
  const optInPathId = customFields.umc_opt_in_path
    ? customFields.umc_opt_in_path
    : defaultProfileOptInId;
  const cell = contact.cell.substring(1);

  if (!contact.external_id) {
    // if there is already an external_id, then we have an existing user
    actionKitSignup(contact);
  }

  const extraFields = {};
  const umcFields = getConfig("UMC_FIELDS", organization);
  if (umcFields) {
    const [extra, external] = umcFields.split(":");
    if (external && contact.external_id) {
      extraFields[external] = contact.external_id;
    }
    if (extra) {
      const fields = extra.split(",");
      for (const f of fields) {
        if (f in customFields) {
          extraFields[f] = String(customFields[f]);
        }
      }
    }
  }
  const options = {
    method: "POST",
    url: createProfileUrl,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      Authorization: umcAuth
    },
    body: {
      phone_number: cell,
      first_name: contact.first_name || "",
      last_name: contact.last_name || "",
      opt_in_path_id: optInPathId,
      ...extraFields
    },
    json: true
  };

  if (process.env.UMC_DEBUG) {
    console.log("UMC_DEBUG enabled", options);
    return;
  }
  return request(options, (error, response) => {
    if (error) throw new Error(error);
  });
}
