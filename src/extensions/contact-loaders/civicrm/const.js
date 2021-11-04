// This contains constants used by the CiviCRM contact loader and action
// handlers. They are in their own file rather that others (like util.js),
// This means that their value does not disappear when other JavaScript
// files are mocked for testing.

// Caching for action handlers and contact loaders should be a length of
// a hour.

export const CIVICRM_CACHE_SECONDS = 3600;

// This sets the 'page' size (i.e, the number of records retrieved at a
// particular time) when retrieved data from CiviCRM.

export const CIVICRM_PAGINATE_SIZE = 100;

// This is the default Contact entity action for retrieving data from CiviCRM.

export const DEFAULT_CONTACT_ENTITY_ACTION_NAME = "get";

// This is the endpoint that React code should use to access CiviCRM data.

export const CIVICRM_INTEGRATION_GROUPSEARCH_ENDPOINT =
  "/integration/civicrm/groupsearch";

// When looking up groups, this is the minimum number of characters that
// should be provided before tinkering a search.

export const CIVICRM_MINQUERY_SIZE = 3;

// Some enviornmental variables are mandatory for the CiviCRM loaders
// and action handlers; others are optional.

export const ENVIRONMENTAL_VARIABLES_MANDATORY = [
  "CIVICRM_API_KEY",
  "CIVICRM_SITE_KEY",
  "CIVICRM_API_URL"
];

export const ENVIRONMENTAL_VARIABLES_OPTIONAL = [
  "CIVICRM_CUSTOM_CONTACT_ACTION",
  "CIVICRM_CUSTOM_DATA",
  "CIVICRM_MESSAGE_IDS"
];

// These are the 'names' of the CIVICRM contact loader and action
// handlers.

export const CIVICRM_CONTACT_LOADER = "civicrm";
export const CIVICRM_ACTION_HANDLER_ADDGROUP = "civicrm-addtogroup";
export const CIVICRM_ACTION_HANDLER_ADDTAG = "civicrm-addtag";
export const CIVICRM_ACTION_HANDLER_REGISTEREVENT = "civicrm-registerevent";
export const CIVICRM_ACTION_HANDLER_SENDEMAIL = "civicrm-sendemail";
