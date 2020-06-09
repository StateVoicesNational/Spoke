import camelCaseKeys from "camelcase-keys";
import { GraphQLError } from "graphql/error";

import { applyScript } from "../../../lib/scripts";
import { Assignment, r, User } from "../../models";

import { getTopMostParent, log } from "../../../lib";

import { sendMessage, findNewCampaignContact } from "./index";

export const bulkSendMessages = async (_, { assignmentId }, { user }) => {
  if (!process.env.ALLOW_SEND_ALL || !process.env.NOT_IN_USA) {
    log.error("Not allowed to send all messages at once");
    throw new GraphQLError({
      status: 403,
      message: "Not allowed to send all messages at once"
    });
  }

  const assignment = await Assignment.get(assignmentId);

  // Assign some contacts
  await findNewCampaignContact(
    undefined,
    {
      assignment,
      assignmentId,
      numberContacts: Number(process.env.BULK_SEND_CHUNK_SIZE) - 1
    },
    { user }
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
      is_deleted: false
    });

  const topmostParent = getTopMostParent(interactionSteps);

  const texter = camelCaseKeys(await User.get(assignment.user_id));
  const customFields = Object.keys(JSON.parse(contacts[0].custom_fields));

  const promises = contacts.map(async contact => {
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
    return sendMessage(
      undefined,
      { message: contactMessage, campaignContactId: contact.id },
      { user }
    );
  });

  return await Promise.all(promises);
};
