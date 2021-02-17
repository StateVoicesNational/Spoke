import { GraphQLError } from "graphql/error";

import { Message, cacheableData } from "../../models";

import { getSendBeforeTimeUtc } from "../../../lib/timezones";
import { jobRunner } from "../../../extensions/job-runners";
import { Tasks } from "../../../workers/tasks";
import { updateContactTags } from "./updateContactTags";

import { sendEmail } from "../../mail";
import { log } from "../../../lib";

const JOBS_SAME_PROCESS = !!(
  process.env.JOBS_SAME_PROCESS || global.JOBS_SAME_PROCESS
);

const newError = (message, code, details = {}) => {
  const err = new GraphQLError(message);
  err.code = code;
  if (process.env.DEBUGGING_EMAILS) {
    sendEmail({
      to: process.env.DEBUGGING_EMAILS.split(","),
      subject: `Spoke Send Message Error`,
      html: `
        <body>
          <div><b>ERROR CODE: ${code}</b></div>
          <div>ERROR MESSAGE: ${message}</div>
          <br />
          <div>DETAILS</div>
          <pre>${JSON.stringify(
            {
              ...details.message,
              campaignContactId: details.campaignContactId,
              user: details.user
                ? {
                    id: details.user.id,
                    name: `${details.user.first_name} ${details.user.last_name}`
                  }
                : undefined,
              campaign: details.campaign
                ? {
                    id: details.campaign.id,
                    title: details.campaign.title,
                    organizationId: details.campaign.organization_id
                  }
                : undefined
            },
            null,
            2
          )}
          </pre>
        </body>
      `
    }).catch(emailErr => log.debug(emailErr));
  }
  return err;
};

export const sendMessage = async (
  _,
  { message, campaignContactId, cannedResponseId },
  { user, loaders }
) => {
  // contact is mutated, so we don't use a loader
  let contact = await cacheableData.campaignContact.load(campaignContactId);
  const campaign = await loaders.campaign.load(contact.campaign_id);

  if (
    contact.assignment_id !== parseInt(message.assignmentId) ||
    campaign.is_archived
  ) {
    console.error("Error: assignment changed");
    throw newError("Your assignment has changed", "SENDERR_ASSIGNMENTCHANGED", {
      message,
      campaignContactId,
      user,
      campaign
    });
  }
  const organization = await loaders.organization.load(
    campaign.organization_id
  );
  const orgFeatures = JSON.parse(organization.features || "{}");

  const optOut = await cacheableData.optOut.query({
    cell: contact.cell,
    organizationId: campaign.organization_id
  });

  if (optOut) {
    throw newError(
      "Skipped sending because this contact was already opted out",
      "SENDERR_OPTEDOUT",
      {
        message,
        campaignContactId,
        user,
        campaign
      }
    );
  }
  // const zipData = await r.table('zip_code')
  //   .get(contact.zip)
  //   .default(null)

  // const config = {
  //   textingHoursEnforced: organization.texting_hours_enforced,
  //   textingHoursStart: organization.texting_hours_start,
  //   textingHoursEnd: organization.texting_hours_end,
  // }
  // const offsetData = zipData ? { offset: zipData.timezone_offset, hasDST: zipData.has_dst } : null
  // if (!isBetweenTextingHours(offsetData, config)) {
  //   throw new GraphQLError({
  //     status: 400,
  //     message: "Skipped sending because it's now outside texting hours for this contact"
  //   })
  // }

  const { text } = message;

  if (text.length > (process.env.MAX_MESSAGE_LENGTH || 99999)) {
    throw newError("Message was longer than the limit", "SENDERR_MAXLEN", {
      message,
      campaignContactId,
      user,
      campaign
    });
  }

  const replaceCurlyApostrophes = rawText =>
    rawText.replace(/[\u2018\u2019]/g, "'");

  let contactTimezone = {};
  if (contact.timezone_offset) {
    // couldn't look up the timezone by zip record, so we load it
    // from the campaign_contact directly if it's there
    const [offset, hasDST] = contact.timezone_offset.split("_");
    contactTimezone.offset = parseInt(offset, 10);
    contactTimezone.hasDST = hasDST === "1";
  }

  const sendBefore = getSendBeforeTimeUtc(
    contactTimezone,
    {
      textingHoursEnd: organization.texting_hours_end,
      textingHoursEnforced: organization.texting_hours_enforced
    },
    {
      textingHoursEnd: campaign.texting_hours_end,
      overrideOrganizationTextingHours:
        campaign.override_organization_texting_hours,
      textingHoursEnforced: campaign.texting_hours_enforced,
      timezone: campaign.timezone
    }
  );

  const sendBeforeDate = sendBefore ? sendBefore.toDate() : null;
  if (sendBeforeDate && sendBeforeDate <= Date.now()) {
    throw newError(
      "Outside permitted texting time for this recipient",
      "SENDERR_OFFHOURS",
      {
        message,
        campaignContactId,
        user,
        campaign
      }
    );
  }
  const serviceName =
    orgFeatures.service ||
    global.DEFAULT_SERVICE ||
    process.env.DEFAULT_SERVICE ||
    "";

  const finalText = replaceCurlyApostrophes(text);
  const messageInstance = new Message({
    text: finalText,
    contact_number: contact.cell,
    user_number: "",
    user_id: user.id,
    campaign_contact_id: contact.id,
    messageservice_sid: null,
    send_status: JOBS_SAME_PROCESS ? "SENDING" : "QUEUED",
    service: serviceName,
    is_from_contact: false,
    queued_at: new Date(),
    send_before: sendBeforeDate
  });

  const initialMessageStatus = contact.message_status;

  const saveResult = await cacheableData.message.save({
    messageInstance,
    contact,
    campaign,
    organization,
    texter: user,
    cannedResponseId
  });
  if (!saveResult.message) {
    console.log("SENDERR_SAVEFAIL", saveResult);
    throw newError(
      `Message send error ${saveResult.texterError || ""}`,
      "SENDERR_SAVEFAIL"
    );
  }
  contact.message_status = saveResult.contactStatus;

  if (!saveResult.blockSend) {
    await jobRunner.dispatchTask(Tasks.SEND_MESSAGE, {
      message: saveResult.message,
      contact,
      // TODO: start a transaction inside the service send message function
      trx: null,
      organization,
      campaign
    });
  }

  if (cannedResponseId) {
    const cannedResponses = await cacheableData.cannedResponse.query({
      campaignId: campaign.id,
      cannedResponseId
    });
    if (cannedResponses && cannedResponses.length) {
      const cannedResponse = cannedResponses.find(
        res => res.id === Number(cannedResponseId)
      );
      if (
        cannedResponse &&
        cannedResponse.tagIds &&
        cannedResponse.tagIds.length
      ) {
        await updateContactTags(
          null,
          {
            campaignContactId,
            tags: cannedResponse.tagIds.map(t => ({
              id: t
            }))
          },
          { user, loaders }
        );
      }
    }
  }

  if (initialMessageStatus === "needsMessage") {
    // don't both requerying the messages list on the response
    contact.messages = [
      {
        id: "initial",
        text: finalText,
        created_at: new Date(),
        is_from_contact: false
      }
    ];
  }
  return contact;
};
