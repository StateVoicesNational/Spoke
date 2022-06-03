import fetch from "node-fetch";

/*
  Campaign contacts must be uploaded with the following custom fields:

   * nationbuilder_id: id of the campaign contact in NB

  The following envionment variables are also required:

   * NATIONBUILDER_API_TOKEN
   * NATIONBUILDER_SITE_SLUG
   * NATIONBUILDER_NATION
   * NATIONBUILDER_DEBUG (optional - it'll dump the output of api request stderr)
   * NATIONBUILDER_RECRUITER_ID (optional - it'll set the recruiter_id on the RSVP)
   * NATIONBUILDER_EVENT_CACHE_EXPIRES - (optional - seconds to cache event data from NB)

  You should then add a question that displays a list of events (likely populated from a custom field) and create
  as many question responses as the maximum number of events that can be selected. Add this handler to that question.

  The question responses should have the index of the event in the name (with the index at 1). E.g. the response 
  with name "Event 1" would reference the first event in the nationbuilder_event_ids list.

  When a question response is selected, it will find the event id for that index and attempt to RSVP this person to
  the event using the NationBuilder API. It'll write the result of the API call into the custom fields.
*/

export const name = "nationbuilder-rsvp";

export const displayName = () => "NationBuilder Event RSVP";

export const instructions = () => "Send a RSVP to a NationBuilder event";

export function serverAdministratorInstructions() {
  return {
    description: `
      Enables sending RSVPs to NationBuilder events as action in an interaction.
      `,
    setupInstructions: `
      Requires \`NATIONBUILDER_*\` envrionment variables to be set.

      Contacts must be uploaded with \`nationbuilder_id\` and \`nationbuilder_event_ids\` fields.
      `,
    environmentVariables: [
      "NATIONBUILDER_API_TOKEN",
      "NATIONBUILDER_SITE_SLUG",
      "NATIONBUILDER_NATION",
      "NATIONBUILDER_DEBUG",
      "NATIONBUILDER_RECRUITER_ID",
      "NATIONBUILDER_EVENT_CACHE_EXPIRES"
    ]
  };
}

export async function available(organizationId) {
  return {
    result:
      !!process.env.NATIONBUILDER_API_TOKEN &&
      !!process.env.NATIONBUILDER_SITE_SLUG &&
      !!process.env.NATIONBUILDER_NATION,
    expiresSeconds: 3600
  };
}

export function clientChoiceDataCacheKey(organization, user) {
  const nation = process.env.NATIONBUILDER_NATION;
  const site = process.env.NATIONBUILDER_SITE_SLUG;

  return `nationbuilder_rsvp_${nation}_${site}`;
}

export async function getClientChoiceData(organization, user) {
  const nation = process.env.NATIONBUILDER_NATION;
  const site = process.env.NATIONBUILDER_SITE_SLUG;
  const token = process.env.NATIONBUILDER_API_TOKEN;
  const debug = process.env.NATIONBUILDER_DEBUG;
  const expires = process.env.NATIONBUILDER_EVENT_CACHE_EXPIRES || 300;

  console.info(`${name}: Updating events from NB`);

  const items = [];
  try {
    const response = await fetch(
      `https://${nation}.nationbuilder.com/api/v1/sites/${site}/pages/events?access_token=${token}`
    );
    if (!response.ok) {
      throw Error(response);
    }
    const events = await response.json();
    for (const event of events.results) {
      const item = {
        name: event.name,
        details: JSON.stringify({ id: event.id })
      };
      if (debug) console.info(`${name}: Adding event:`, item);
      items.push(item);
    }
  } catch (e) {
    console.error(`${name}: Error fetching NB events:`, e);
    items.push({
      name: "error"
    });
  }

  if (debug) console.info(`${name}: Caching NB response for ${expires}s`);
  return {
    data: `${JSON.stringify({ items })}`,
    expiresSeconds: expires
  };
}

export async function processAction({ interactionStep, contact }) {
  const nation = process.env.NATIONBUILDER_NATION;
  const site = process.env.NATIONBUILDER_SITE_SLUG;
  const token = process.env.NATIONBUILDER_API_TOKEN;
  const debug = process.env.NATIONBUILDER_DEBUG;
  const recruiter_id = process.env.NATIONBUILDER_RECRUITER_ID;

  const contactFields = JSON.parse(contact.custom_fields || "{}");
  const actionData = JSON.parse(
    JSON.parse(interactionStep.answer_actions_data || "{}").value || "{}"
  );

  if (debug)
    console.info(
      `${name}: processing contact/action:`,
      contactFields,
      actionData
    );

  const eventId = actionData.id;
  const rsvp_params = {
    rsvp: {
      person_id: contactFields.nationbuilder_id
    }
  };
  if (recruiter_id) rsvp_params["recruiter_id"] = recruiter_id;

  let contactFieldResponse = contactFields["nationbuilder_rsvp_" + eventId];
  if (!contactFieldResponse) {
    contactFieldResponse = {
      status: null,
      message: null,
      rsvp_id: null,
      created_at: new Date()
    };
  }
  try {
    const response = await fetch(
      `https://${nation}.nationbuilder.com/api/v1/sites/${site}/pages/events/${eventId}/rsvps?access_token=${token}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(rsvp_params)
      }
    );
    if (response.ok) {
      const rsvp = await response.json();
      if (debug) console.info(`${name}: Success:`, rsvp);
      contactFieldResponse.status = "success";
      contactFieldResponse.rsvp_id = rsvp.id;
    } else {
      const body = await response.text();
      if (body.match(/signup_id has already been taken/)) {
        if (debug) console.info(`${name}: Already RSVP'ed:`, body);
        contactFieldResponse.status = "success";
        contactFieldResponse.message = "already rsvped";
      } else {
        console.error(
          `${name}: NB error processing RSVP:`,
          response.status,
          response.statusText,
          body
        );
        throw Error(body);
      }
    }
  } catch (e) {
    console.error(`${name}: System error processing RSVP:`, e);
    contactFieldResponse.status = "error";
    contactFieldResponse.message = e.toString();
  }

  contactFields["nationbuilder_rsvp_" + eventId] = contactFieldResponse;
  contact.custom_fields = JSON.stringify(contactFields);
  await contact.save();
}
