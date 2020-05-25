import request from "request";
import { r } from "../../server/models";
import crypto from "crypto";

export const name = "actionkit-rsvp";
export const displayName = () => "ActionKit Event RSVP";

export const instructions = () =>
  `
  Campaign contacts MUST be uploaded with "event_id" and "event_page" fields
  along with external_id=<actionkit user.id>.
  Optional fields include "event_source" (defaults to 'spoke') and "event_field_*" fields and "event_action_*"
  which will be added as post data where '*' can be any word which will map to an action/event field.
  `;

export function serverAdministratorInstructions() {
  return {
    description: `
      Campaign contacts MUST be uploaded with "event_id" and "event_page" fields
      along with external_id=<actionkit user.id>.
      Optional fields include "event_source" (defaults to 'spoke') and "event_field_*" fields and "event_action_*"
      which will be added as post data where '*' can be any word which will map to an action/event field.
      `,
    setupInstructions:
      "Add `actionkit-rsvp` to the environment variable `ACTION_HANDLERS`; refer to `docs/HOWTO_INTEGRATE_WITH_ACTIONKIT.md`",
    environmentVariables: ["AK_BASEURL", "AK_SECRET"]
  };
}

export async function available(organizationId) {
  let isAvailable = false;
  if (process.env.AK_BASEURL && process.env.AK_SECRET) {
    isAvailable = true;
  } else {
    const org = await r
      .knex("organization")
      .where("id", organizationId)
      .select("features");
    const features = JSON.parse(org.features || "{}");
    let needed = [];
    if (!process.env.AK_BASEURL && !features.AK_BASEURL) {
      needed.push("AK_BASEURL");
    }
    if (!process.env.AK_SECRET && !features.AK_SECRET) {
      needed.push("AK_SECRET");
    }
    if (needed.length) {
      console.error(
        "actionkit-rsvp unavailable because " +
          needed.join(", ") +
          " must be set (either in environment variables or json value for organization)"
      );
    }
    isAvailable = !!needed.length;
  }

  return {
    result: isAvailable,
    expiresSeconds: 600
  };
}

export const akidGenerate = function(ak_secret, cleartext) {
  const shaHash = crypto.createHash("sha256");
  shaHash.write(`${ak_secret}.${cleartext}`);
  const shortHash = shaHash.digest("base64").slice(0, 6);
  return `${cleartext}.${shortHash}`;
};

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
      "campaign_contact.custom_fields as custom_fields",
      "campaign_contact.external_id as external_id",
      "organization.features as features",
      "organization.id as organization_id"
    );
  const contact = contactRes.length ? contactRes[0] : {};

  if (contact.external_id && contact.custom_fields != "{}") {
    try {
      const customFields = JSON.parse(contact.custom_fields || "{}");
      const features = JSON.parse(contact.features || "{}");
      const actionkitBaseUrl = process.env.AK_BASEURL || features.AK_BASEURL;
      const akSecret = process.env.AK_SECRET || features.AK_SECRET;

      if (
        actionkitBaseUrl &&
        customFields.event_id &&
        customFields.event_page
      ) {
        const userData = {
          event_id: customFields.event_id,
          page: customFields.event_page,
          role: "attendee",
          status: "active",
          akid: akidGenerate(akSecret, "." + contact.external_id),
          event_signup_ground_rules: "1",
          source: customFields.event_source || "spoke",
          suppress_subscribe: customFields.suppress_subscribe || "1"
        };
        for (let field in customFields) {
          if (field.startsWith("event_field_")) {
            userData["event_" + field.slice("event_field_".length)] =
              customFields[field];
          } else if (field.startsWith("event_action_")) {
            userData[field.slice("event_".length)] = customFields[field];
          }
        }
        request.post(
          {
            url: `${actionkitBaseUrl}/act/`,
            form: userData
          },
          async function(err, httpResponse, body) {
            // TODO: should we save the action id somewhere?
            if (err || (body && body.error)) {
              console.error(
                "error: actionkit event sign up failed",
                err,
                userData,
                body
              );
            } else {
              if (httpResponse.headers && httpResponse.headers.location) {
                const actionId = httpResponse.headers.location.match(
                  /action_id=([^&]+)/
                );
                if (actionId) {
                  // save the action id of the rsvp back to the contact record
                  customFields["processed_event_action"] = actionId[1];
                  await r
                    .knex("campaign_contact")
                    .where("campaign_contact.id", campaignContactId)
                    .update("custom_fields", JSON.stringify(customFields));
                }
              }
              console.info(
                "actionkit event sign up SUCCESS!",
                userData,
                httpResponse,
                body
              );
            }
          }
        );
      }
    } catch (err) {
      console.error(
        "Processing Actionkit RSVP action failed on custom field parsing",
        campaignContactId,
        err
      );
    }
  }
}
