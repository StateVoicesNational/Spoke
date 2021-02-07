import { getConfig } from "../../../server/api/lib/config";
const Van = require("../../../extensions/action-handlers/ngpvan-action");

import { getActionChoiceData } from "../../../extensions/action-handlers";

export const DEFAULT_NGP_VAN_INITIAL_TEXT_CANVASS_RESULT = "Texted";

export const serverAdministratorInstructions = () => {
  return {
    description: `
      Update the contact in VAN with a status of Texted
      when the initial message is sent to the contact
      for a campaign.
    `,
    setupInstructions: `
      This message handler is dependent on the ngpvan-action Action Handler.
      Follow its setup instructions.
    `,
    environmentVariables: []
  };
};

export const available = organization =>
  !!getConfig("NGP_VAN_API_KEY", organization) &&
  !!getConfig("NGP_VAN_APP_NAME", organization);

// export const preMessageSave = async () => {};

export const postMessageSave = async ({ message, contact, organization }) => {
  if (!exports.available(organization)) {
    return {};
  }

  if (
    message.is_from_contact ||
    !contact ||
    contact.message_status !== "needsMessage"
  ) {
    return {};
  }

  const clientChoiceData = await getActionChoiceData(Van, organization);
  const initialTextResult =
    getConfig("NGP_VAN_INITIAL_TEXT_CANVASS_RESULT", organization) ||
    DEFAULT_NGP_VAN_INITIAL_TEXT_CANVASS_RESULT;

  const texted = clientChoiceData.find(ccd => ccd.name === initialTextResult);
  if (!texted) {
    // eslint-disable-next-line no-console
    console.error(
      `NGPVAN message handler -- not handling message because no action choice data found for ${initialTextResult}`
    );

    return {};
  }

  const body = JSON.parse(texted.details);

  return Van.postCanvassResponse(contact, organization, body)
    .then(() => ({}))
    .catch(caughtError => {
      // eslint-disable-next-line no-console
      console.error(
        "Encountered exception in ngpvan.postMessageSave",
        caughtError
      );
      return {};
    });
};
