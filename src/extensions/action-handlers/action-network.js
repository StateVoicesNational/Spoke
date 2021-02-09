/* eslint no-console: 0 */
/* eslint no-underscore-dangle: 0 */
import moment from "moment";
import util from "util";
import { getConfig } from "../../server/api/lib/config";

import httpRequest from "../../server/lib/http-request.js";

export const setTimeoutPromise = util.promisify(setTimeout);

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
export async function processAction({
  answerActionObject,
  contact,
  organization
}) {
  try {
    const email = JSON.parse(contact.custom_fields || "{}").email;
    if (!email) {
      throw new Error("Missing contact email");
    }

    const actionData = JSON.parse(
      JSON.parse(answerActionObject.answer_actions_data || "{}").value || "{}"
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

const getPage = async (item, page, organization) => {
  const url = makeUrl(`${item}?page=${page}`);
  try {
    const pageResponse = await httpRequest(url, {
      method: "GET",
      headers: {
        ...makeAuthHeader(organization)
      }
    })
      .then(async response => await response.json())
      .catch(error => {
        const message = `Error retrieving ${item} from ActionNetwork ${error}`;
        console.error(message);
        throw new Error(message);
      });

    return {
      item,
      page,
      pageResponse
    };
  } catch (caughtError) {
    console.error(
      `Error loading ${item} page ${page} from ActionNetwork ${caughtError}`
    );
    throw caughtError;
  }
};

const extractReceived = (item, responses) => {
  const toReturn = [];
  responses[item].forEach(response => {
    toReturn.push(...((response._embedded || [])[`osdi:${item}`] || []));
  });
  return toReturn;
};

export async function getClientChoiceData(organization) {
  const responses = {
    tags: [],
    events: []
  };

  try {
    const firstPagePromises = [
      getPage("events", 1, organization),
      getPage("tags", 1, organization)
    ];

    const [firstEventsResponse, firstTagsResponse] = await Promise.all(
      firstPagePromises
    );

    responses.events.push(firstEventsResponse.pageResponse);
    responses.tags.push(firstTagsResponse.pageResponse);

    const pagesNeeded = {
      events: firstEventsResponse.pageResponse.total_pages,
      tags: firstTagsResponse.pageResponse.total_pages
    };

    const pageToDo = [];

    Object.entries(pagesNeeded).forEach(([item, pageCount]) => {
      for (let i = 2; i <= pageCount; ++i) {
        pageToDo.push([item, i, organization]);
      }
    });

    const REQUESTS_PER_SECOND = 4;
    const WAIT_MILLIS = 1100;
    let pageToDoStart = 0;

    while (pageToDoStart < pageToDo.length) {
      if (pageToDo.length > REQUESTS_PER_SECOND - firstPagePromises.length) {
        await exports.setTimeoutPromise(WAIT_MILLIS);
      }

      const pageToDoEnd = pageToDoStart + REQUESTS_PER_SECOND;
      const thisTranche = pageToDo.slice(pageToDoStart, pageToDoEnd);

      const pagePromises = thisTranche.map(thisPageToDo => {
        return getPage(...thisPageToDo);
      });

      const pageResponses = await Promise.all(pagePromises);

      pageResponses.forEach(pageResponse => {
        responses[pageResponse.item].push(pageResponse.pageResponse);
      });
      pageToDoStart = pageToDoEnd;
    }
  } catch (caughtError) {
    console.error(`Error loading choices from ActionNetwork ${caughtError}`);
    return {
      data: `${JSON.stringify({
        error: "Failed to load choices from ActionNetwork"
      })}`
    };
  }

  const receivedEvents = [...extractReceived("events", responses)];
  const receivedTags = [...extractReceived("tags", responses)];

  const identifierRegex = /action_network:(.*)/;
  const toReturn = [];

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

    toReturn.push({
      name: `RSVP ${event.name || event.title}`,
      details: JSON.stringify({
        type: "event",
        identifier
      })
    });
  });

  receivedTags.forEach(tag => {
    toReturn.push({
      name: `TAG ${tag.name}`,
      details: JSON.stringify({
        type: "tag",
        tag: `${tag.name}`
      })
    });
  });

  return {
    data: `${JSON.stringify({ items: toReturn })}`,
    expiresSeconds:
      Number(getConfig(envVars.CACHE_TTL, organization)) || defaults.CACHE_TTL
  };
}

export async function available(organization) {
  const result = !!getConfig(envVars.API_KEY, organization);

  if (!result) {
    console.info(
      "action-network action unavailable. Missing one or more required environment variables"
    );
  }

  return {
    result,
    expiresSeconds: 86400
  };
}
