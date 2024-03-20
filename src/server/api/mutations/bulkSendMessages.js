import { camelizeKeys } from "humps";
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

  const texter = camelizeKeys(await User.get(assignment.user_id));
  let customFields = Object.keys(JSON.parse(contacts[0].custom_fields));

  const texterSideboxes = getConfig("TEXTER_SIDEBOXES") || "";
  const shouldHideNotesField = /contact-notes/.test(texterSideboxes);

  if (shouldHideNotesField) {
    customFields = customFields.filter(f => f !== "notes");
  }

  const promises = contacts.map(async contact => {
    contact.customFields = contact.custom_fields;
    const text = applyScript({
      contact: camelizeKeys(contact),
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
    return sendMessage(
      undefined,
      { message: contactMessage, campaignContactId: contact.id },
      { user, loaders }
    );
  });

  return await Promise.all(promises);
};
