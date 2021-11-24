# gVIRS contact loader

## Introduction

The gVIRS contact loader lets Spoke admins load voters directly from gVIRS via its API for the purposes of textbanking campaigns.
It does away with the need to export and handle sensitive voter data in CSV files, etc., and speeds up the

## Installation

You have to add the `GVIRS_CONNECTIONS` environment variable to your Spoke `.env` file to enable the contact loader.
You also have to create an Authorised App within gVIRS and use the app ID and API key values in the environment variable.

## gVIRS configuration

When creating an authorised app in gVIRS for Spoke, you have to grant it several specific permissions for the loader to work.
The following table shows with actions are required for the various entities and data models (single_table, etc.) that the
contact loader uses.

| Entity          | single_table              | extended_flat             | extended_nested |
| --------------- | ------------------------- | ------------------------- | --------------- |
| phone_filter    | load                      |                           |                 |
| voter_for_spoke |                           | all actions               |                 |
| voter_segment   | count_total, load, search | count_total, load, search |                 |

## Spoke configuration

### GVIRS_CONNECTIONS

This variable supports the definition of multiple gVIRS API endpoints, to accommodate the fact that gVIRS splits the electoral roll
into eight separate databases/instances for the sake of security, performance, etc. Accordingly the `GVIRS_CONNECTIONS` variable
uses a syntax that specifies which gVIRS endpoint to connect to, and how to map it to the correct Spoke organisation.

The variable takes _semi-colon separated configurations_, with _each configuration composed of four comma-separated parts_, in order:

- Spoke organisation name
- gVIRS base host URL
- API key
- app ID

For example:

`GVIRS_CONNECTIONS=Test Org,https://contact-foo.greens.org.au/gvirs,mySecretAPIKey,myAppID;Another Org,https://contact-bar.greens.org.au/gvirs,anotherSecretAPIKey,anotherAppID`

### GVIRS_CUSTOM_DATA

This variable specifies which custom data from the gVIRS API you wish to load in, and optionally, how you wish to rename the data field for
use within Spoke. The variable takes a _comma-separated list_ of `field:label` pairs, where `field` is the gVIRS API data field, and
`label` is the renamed representation of that data within Spoke.

For example:

`GVIRS_CUSTOM_DATA=id:gvirsId,enrolled_federal_division_name:fedElec,enrolled_state_district_name:stateDistrict,enrolled_local_gov_area_name:LGA`
