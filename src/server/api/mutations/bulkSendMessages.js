import camelCaseKeys from "camelcase-keys";
import { GraphQLError } from "graphql/error";

import { getConfig } from "../lib/config";
import { applyScript } from "../../../lib/scripts";
import { Assignment, User, r, cacheableData } from "../../models";

import { log } from "../../../lib";

import { sendMessage, findNewCampaignContact } from "./index";

export const bulkSendMessages = async (
  _,
  { assignmentId },
  { user, loaders }
) => {
  const assignment = await cacheableData.assignment.load(assignmentId);
  const organization = await cacheableData.campaign.loadCampaignOrganization({
    campaignId: assignment.campaign_id
  });

  if (
    !getConfig("ALLOW_SEND_ALL") ||
    !getConfig("ALLOW_SEND_ALL_ENABLED", organization)
  ) {
    log.error("Not allowed to send all messages at once");
    throw new GraphQLError({
      status: 403,
      message: "Not allowed to send all messages at once"
    });
  }

  // Assign some contacts
  await findNewCampaignContact(
    undefined,
    {
      assignment,
      assignmentId,
      numberContacts: Number(process.env.BULK_SEND_CHUNK_SIZE) - 1
    },
    { user, loaders }
  );

  const contacts = await r
    .knex("campaign_contact")
    .where({
      message_status: "needsMessage"
    })
    .where({
      assignment_id: assignmentId
    })
    .orderByRaw("updated_at")
    .limit(process.env.BULK_SEND_CHUNK_SIZE);

  const interactionSteps = await r
    .knex("interaction_step")
    .where({
      campaign_id: assignment.campaign_id
    })
    .where({
      parent_interaction_id: null
    })
    .where({
      is_deleted: false
    });

  const topmostParent = interactionSteps[0];

  const texter = camelCaseKeys(await User.get(assignment.user_id));
  let customFields = Object.keys(JSON.parse(contacts[0].custom_fields));

  const texterSideboxes = getConfig("TEXTER_SIDEBOXES") || "";
  const shouldHideNotesField = /contact-notes/.test(texterSideboxes);

  if (shouldHideNotesField) {
    customFields = customFields.filter(f => f !== "notes");
  }

  // Chunk size
  const chunkSize = process.env.BULK_SEND_CHUNK_PROMISES ? parseInt(process.env.BULK_SEND_CHUNK_PROMISES) : 10;

  // Process promises in chunks
  log.info(`started processing bulk send: total contacts ${contacts.length}`)
  for (let i = 0; i < contacts.length; i += chunkSize) {
    const chunk = contacts.slice(i, i + chunkSize);
    log.info(`Processing contacts from ${i} to ${i + chunkSize}`);
  
    const promises = chunk.map(async contact => {
      try {
        contact.customFields = contact.custom_fields;
        const text = applyScript({
          contact: camelCaseKeys(contact),
          texter,
          script: topmostParent.script,
          customFields
        });
  
        const contactMessage = {
          contactNumber: contact.cell,
          userId: assignment.user_id,
          text,
          assignmentId
        };
  
        return await sendMessage(
          undefined,
          { message: contactMessage, campaignContactId: contact.id },
          { user, loaders }
        );
  
      } catch (error) {
        log.error(`Error processing contact ${contact.id}: ${error.message}`);
        throw error;
      }
    });
  
    try {
      await Promise.all(promises);
      log.info(`Successfully processed contacts from ${i} to ${i + chunkSize}`);
    } catch (error) {
      log.error(`Error in chunk from ${i} to ${i + chunkSize}: ${error.message}`);
      throw error;
    }
  }
  log.info('completed bulk send')
  
};
