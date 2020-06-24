import request from "request";
import aws from "aws-sdk";
import { r } from "../../server/models";
import { actionKitSignup } from "./helper-ak-sync.js";

const sqs = new aws.SQS();

export const name = "revere-signup";

// What the user sees as the option
export const displayName = () => "Revere Signup";

const listId = process.env.REVERE_LIST_ID;
const defaultMobileFlowId = process.env.REVERE_NEW_SUBSCRIBER_MOBILE_FLOW;
const mobileApiKey = process.env.REVERE_MOBILE_API_KEY;
const sendContentUrl = process.env.REVERE_API_URL;
const akAddUserUrl = process.env.AK_ADD_USER_URL;
const akAddPhoneUrl = process.env.AK_ADD_PHONE_URL;
const sqsUrl = process.env.REVERE_SQS_URL;

// The Help text for the user after selecting the action
export const instructions = () =>
  "This option triggers a new user request to Revere when selected.";

export function serverAdministratorInstructions() {
  return {
    description: `
      This option triggers a new user request to Revere when selected."
      `,
    setupInstructions:
      "Add `revere-signup` to the environment variable `ACTION_HANDLERS`; refer to `docs/HOWTO_INTEGRATE_WITH_REVERE.md`",
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
    result: organizationId && listId && mobileApiKey,
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
  const mobileFlowId = customFields.revere_signup_flow
    ? customFields.revere_signup_flow
    : defaultMobileFlowId;
  const contactCell = contact.cell.substring(1);

  if (sqsUrl) {
    const msg = {
      payload: {
        cell: `${contactCell}`,
        mobile_flow_id: `${mobileFlowId}`,
        source: "spoke"
      }
    };

    const sqsParams = {
      MessageBody: JSON.stringify(msg),
      QueueUrl: sqsUrl
    };

    sqs.sendMessage(sqsParams, (err, data) => {
      if (err) {
        console.log("Error sending message to queue", err);
      }
      console.log("Sent message to queue with data:", data);
    });
  } else {
    const options = {
      method: "POST",
      url: sendContentUrl,
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        Authorization: mobileApiKey
      },
      body: {
        msisdns: [`00${contactCell}`],
        mobileFlow: `${mobileFlowId}`
      },
      json: true
    };

    return request(options, (error, response) => {
      if (error) throw new Error(error);
    });
  }

  if (akAddUserUrl && akAddPhoneUrl) actionKitSignup(contact);
}
