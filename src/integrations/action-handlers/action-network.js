/* eslint no-console: 0 */
import moment from "moment";
import { getConfig } from "../../server/api/lib/config";

import httpRequest from "../../server/lib/http-request.js";

export const name = "action-network";

// What the user sees as the option
export const displayName = () => "Action Network";

// The Help text for the user after selecting the action
export const instructions = () =>
  `
  This action is for reporting the results of interactions with contacts to Action Network
  `;

export const envVars = Object.freeze({
  API_KEY: "ACTION_NETWORK_API_KEY",
  DOMAIN: "ACTION_NETWORK_API_DOMAIN",
  BASE_URL: "ACTION_NETWORK_API_BASE_URL",
  CACHE_TTL: "ACTION_NETWORK_ACTION_HANDLER_CACHE_TTL"
});

export const defaults = Object.freeze({
  DOMAIN: "https://actionnetwork.org",
  BASE_URL: "/api/v2",
  CACHE_TTL: 1800
});

export const makeUrl = url =>
  `${getConfig(envVars.DOMAIN) || defaults.DOMAIN}${getConfig(
    envVars.BASE_URL
  ) || defaults.BASE_URL}/${url}`;

export const makeAuthHeader = organization => ({
  "OSDI-API-Token": getConfig(envVars.API_KEY, organization)
});

export function serverAdministratorInstructions() {
  return {
    description:
      "This action is for reporting the results of interactions with contacts to Action Network",
    setupInstructions:
      "Get an API key for your Action Network account. Add it to your config. In most cases the defaults for the other environment variables will work",
    environmentVariables: envVars.values
  };
}

export function clientChoiceDataCacheKey(organization) {
  return `${organization.id}`;
}

const handlers = {
  event: (email, actionData) => {
    const identifier = actionData.identifier;
    if (!identifier) {
      throw new Error("Missing identifier for event");
    }

    return {
      path: `events/${identifier}/attendances`,
      body: {
        person: { email_addresses: [{ address: `${email}` }] },
        triggers: {
          autoresponse: {
            enabled: true
          }
        }
      }
    };
  }
};

// What happens when a texter saves the answer that triggers the action
// This is presumably the meat of the action
export async function processAction(
  unusedQuestionResponse,
  interactionStep,
  unusedCampaignContactId,
  contact,
  unusedCampaign,
  organization
) {
  try {
    const email = JSON.parse(contact.custom_fields || "{}").email;
    if (!email) {
      throw new Error("Missing contact email");
    }

    const actionData = JSON.parse(
      JSON.parse(interactionStep.answer_actions_data || "{}").value || "{}"
    );
    if (!actionData) {
      throw new Error("Missing action data");
    }

    const actionType = actionData.type;
    if (!actionType) {
      throw new Error("Missing action data");
    }

    const postDetails = handlers[actionType](email, actionData);
    if (!postDetails) {
      throw new Error(`No handler for action type ${actionType}`);
    }

    const { path, body } = postDetails;

    if (!path || !body) {
      throw new Error(
        `Handler for action type ${actionType} missing path or body ${postDetails}`
      );
    }

    console.info(
      "Sending updagte to Action Network",
      JSON.stringify(postDetails)
    );

    const url = makeUrl(path);
    await httpRequest(url, {
      method: "POST",
      timeout: 30000,
      headers: {
        ...makeAuthHeader(organization),
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
  } catch (caught) {
    console.error(
      "Encountered exception in action-network.processAction",
      caught
    );
    throw caught;
  }
}

const getEventsPage = async (page, organization) => {
  const url = makeUrl(`events?page=${page}`);
  try {
    const eventsResponse = await httpRequest(url, {
      method: "GET",
      headers: {
        ...makeAuthHeader(organization)
      }
    })
      .then(async response => await response.json())
      .catch(error => {
        const message = `Error retrieving events from ActionNetwork ${error}`;
        console.error(message);
        throw new Error(message);
      });

    return eventsResponse;
  } catch (caughtError) {
    console.error(
      `Error loading events page ${page} from ActionNetwork ${caughtError}`
    );
    throw caughtError;
  }
};

export async function getClientChoiceData(organization) {
  let eventsResponses;
  try {
    const firstEventsResponse = await getEventsPage(1, organization);
    eventsResponses = [firstEventsResponse];

    const pageCount = firstEventsResponse.total_pages;
    const pagePromises = [];
    for (let i = 2; i <= pageCount; ++i) {
      const pagePromise = getEventsPage(i, organization);
      pagePromises.push(pagePromise);
    }

    const pageResponses = await Promise.all(pagePromises);
    eventsResponses.push(...pageResponses);
  } catch (caughtError) {
    console.error(`Error loading events from ActionNetwork ${caughtError}`);
    return {
      data: `${JSON.stringify({
        error: "Failed to load events from ActionNetwork"
      })}`
    };
  }

  const receivedEvents = [];
  eventsResponses.forEach(eventsResponse => {
    // eslint-disable-next-line no-underscore-dangle
    const receivedEventsFromThisPage =
      (eventsResponse._embedded || [])["osdi:events"] || [];
    receivedEvents.push(...receivedEventsFromThisPage);
  });

  const identifierRegex = /action_network:(.*)/;
  const events = [];

  receivedEvents.forEach(event => {
    let identifier;

    if (moment(event.start_date) < moment()) {
      return;
    }

    (event.identifiers || []).some(identifierCandidate => {
      const regexMatch = identifierRegex.exec(identifierCandidate);
      if (regexMatch) {
        identifier = regexMatch[1];
        return true;
      }
      return false;
    });

    if (!identifier) {
      return;
    }

    events.push({
      name: event.name || event.title,
      details: JSON.stringify({
        type: "event",
        identifier
      })
    });
  });

  const actions = [];
  actions.push(...events);

  return {
    data: `${JSON.stringify({ items: actions })}`,
    expiresSeconds:
      Number(getConfig(envVars.CACHE_TTL, organization)) || defaults.CACHE_TTL
  };
}

export async function available(organization) {
  let result = !!getConfig(envVars.API_KEY, organization);

  if (!result) {
    console.info(
      "action-network action unavailable. Missing one or more required environment variables"
    );
  }

  if (result) {
    try {
      const { data } = await exports.getClientChoiceData(organization);
      const parsedData = (data && JSON.parse(data)) || {};
      if (parsedData.error) {
        console.info(
          `action-network action unavailable. getClientChoiceData returned error ${parsedData.error}`
        );
        result = false;
      }
    } catch (caughtError) {
      console.info(
        `action-network action unavailable. getClientChoiceData threw an exception ${caughtError}`
      );
      result = false;
    }
  }

  return {
    result,
    expiresSeconds: 86400
  };
}
