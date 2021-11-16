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
