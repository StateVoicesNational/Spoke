// This contains constants used by the gVIRS contact loader and action
// handlers. They are in their own file rather that others (like util.js),
// This means that their value does not disappear when other JavaScript
// files are mocked for testing.

// Caching for action handlers and contact loaders should be a length of
// a hour.

export const GVIRS_CACHE_SECONDS = 3600;

// This sets the 'page' size (i.e, the number of records retrieved at a
// particular time) when retrieved data from gVIRS.

export const GVIRS_PAGINATE_SIZE = 100;

// This is the endpoint that React code should use to access gVIRS data.

export const GVIRS_INTEGRATION_ENDPOINT = "/integration/gvirs";

// When looking up segments, this is the minimum number of characters that
// should be provided before tinkering a search.

export const GVIRS_MINQUERY_SIZE = 3;

// Some enviornmental variables are mandatory for the gVIRS loaders
// and action handlers; others are optional. (These need to be worked on
// the fly.)

export const GVIRS_ENVIRONMENTAL_VARIABLES_MANDATORY = ["GVIRS_CONNECTIONS"];

export const GVIRS_ENVIRONMENTAL_VARIABLES_OPTIONAL = ["GVIRS_CUSTOM_DATA"];

// These are the 'names' of the gVIRS contact loader and action
// handlers.

export const GVIRS_CONTACT_LOADER = "gvirs";
export const GVIRS_ACTION_HANDLER_CREATEVOTERCONTACT =
  "gvirs-createvotercontact";
export const GVIRS_ACTION_HANDLER_REPORTWRONGNUMBER = "gvirs-reportwrongnumber";

// These are "custom" gVIRS fields for voters, where the Spoke texters can
// provide custom tokens representing their values in text messages.

export const GVIRS_CUSTOM_VOTERS_FIELDS = [
  "enrolled_federal_division_name",
  "enrolled_state_district_name",
  "enrolled_local_gov_area_name",
  "v_lsc_contact_date",
  "v_lsc_support_level",
  "v_lsc_notes",
  "v_lsc_contact_status_name",
  "v_lsc_campaign_long_name",
  "v_lsc_contact_labels"
];

// These are "non-custom" gVIRS fields, where their values are mapped to
// standard Spoke fields.

export const GVIRS_NONCUSTOM_VOTERS_FIELDS = [
  "id",
  "surname",
  "first_name",
  "locality_postcode",
  "mobile_latest_phone_number"
];

// These are the fields together (non-custom ones first)

export const GVIRS_VOTERS_FIELDS = [
  ...GVIRS_NONCUSTOM_VOTERS_FIELDS,
  ...GVIRS_CUSTOM_VOTERS_FIELDS
];

export const GVIRS_SPOKE_CONTACT_METHOD_ID = 10; // SMS

export const GVIRS_CREATE_CONTACT_CHOICE_DEFINITIONS = [
  // Required fields: name, support_level, contact_status_id
  // Optional fields:
  // - notes (default is "[From Spoke]"
  // - followup (default false)
  {
    name: "Support level 1 (Strong support)",
    support_level: 1,
    contact_status_id: 1
  },
  {
    name: "Support level 2 (Weak support)",
    support_level: 2,
    contact_status_id: 1
  },
  {
    name: "Support level 3 (Undecided)",
    support_level: 3,
    contact_status_id: 1
  },
  {
    name: "Support level 4 (Weak oppose)",
    support_level: 4,
    contact_status_id: 1
  },
  {
    name: "Support level 5 (Strong oppose)",
    support_level: 5,
    contact_status_id: 1
  },
  {
    name: "Non-Meaningful Interaction",
    support_level: 0,
    contact_status_id: 0
  },
  {
    name: "Busy",
    support_level: 0,
    contact_status_id: 2
  },
  {
    name: "Language Barrier",
    support_level: 0,
    contact_status_id: 3
  },
  {
    name: "No Answer",
    support_level: 0,
    contact_status_id: 4
  },
  {
    name: "Bad Info",
    support_level: 0,
    contact_status_id: 5
  },
  {
    name: "Inaccessible",
    support_level: 0,
    contact_status_id: 6
  },
  {
    name: "Refused",
    support_level: 0,
    contact_status_id: 7
  }
];
