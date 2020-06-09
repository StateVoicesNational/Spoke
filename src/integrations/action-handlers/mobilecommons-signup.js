import request from "request";
import aws from "aws-sdk";
import { r } from "../../server/models";
import { actionKitSignup } from "./helper-ak-sync.js";

export const name = "mobilecommons-signup";

// What the user sees as the option
export const displayName = () => "Mobile Commons Signup";

const akAddUserUrl = process.env.AK_ADD_USER_URL;
const akAddPhoneUrl = process.env.AK_ADD_PHONE_URL;
const createProfileUrl = process.env.UMC_PROFILE_URL;
const defaultProfileOptInId = process.env.UMC_OPT_IN_PATH;
const umcAuth =
  "Basic " +
  Buffer.from(process.env.UMC_USER + ":" + process.env.UMC_PW).toString(
    "base64"
  );
const umcConfigured = defaultProfileOptInId && createProfileUrl;

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
      "UMC_OPT_IN_PATH"
    ]
  };
}

export async function available(organizationId) {
  return {
    result: organizationId && umcConfigured,
    expiresSeconds: 600
  };
}

export async function processAction(
  questionResponse,
  interactionStep,
  campaignContactId
) {
  const contactRes = await r
    .knex("campaign_contact")
    .where("campaign_contact.id", campaignContactId)
    .leftJoin("campaign", "campaign_contact.campaign_id", "campaign.id")
    .leftJoin("organization", "campaign.organization_id", "organization.id")
    .select(
      "campaign_contact.cell",
      "campaign_contact.first_name",
      "campaign_contact.last_name",
      "campaign_contact.custom_fields"
    );

  const contact = contactRes.length ? contactRes[0] : {};
  const customFields = JSON.parse(contact.custom_fields);
  const optInPathId = customFields.umc_opt_in_path
    ? customFields.umc_opt_in_path
    : defaultProfileOptInId;
  const cell = contact.cell.substring(1);

  actionKitSignup(contact);

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
      opt_in_path_id: optInPathId
    },
    json: true
  };

  return request(options, (error, response) => {
    if (error) throw new Error(error);
  });
}
