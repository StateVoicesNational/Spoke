# How to Integrate with CiviCRM

## Introduction

CiviCRM is a web-based, highly customizable CRM released under the GNU AGPL v3 license. It is used by a diverse range of organizations around the world.

At this time the following integrations are available.

### Contact Loader

Load contacts from CiviCRM groups directly into a Spoke campaign. The loader retrieves the following data by default:
- CiviCRM contact ID
- first name
- last name
- zip/post code
- mobile phone

The loader can be configured to import additional fields through the use of Spoke environment variables.

### Action Handlers

Add to Group - add a contact to a specified CiviCRM group from within a Spoke conversation
Add tag to Contact - add a tag to a contact in CiviCRM from within a Spoke conversation

These handlers require the CiviCRM contact loaader be configured and available for use.

Additional action handlers and service managers are in active development.

## Integration instructions

## Step One - creating an API key for CiviCRM

Integration with CiviCRM requires the creation of an API key, bound to a specific contact record or user account in CiviCRM, with suitable permissions.
The [CiviCRM System Administration guide](https://docs.civicrm.org/sysadmin/en/latest/setup/api-keys/) includes instructions on how to create an API key.

## Step Two - making sure your variables are set in your production/development deployment environment

Modify your Spoke .env file to include the following environment variables:

- CONTACT_LOADERS - add `civicrm`
- CIVICRM_API_URL - should be the full URL of the [CiviCRM REST API](https://docs.civicrm.org/dev/en/latest/api/v3/rest/)
  (eg. https://example.com/sites/all/modules/civicrm/extern/rest.php)
- CIVICRM_API_KEY - the key you generated in step one
- CIVICRM_SITE_KEY - the site key for your CiviCRM installation. Defined in your `civicrm.settings.php` file ([more info](https://docs.civicrm.org/sysadmin/en/latest/setup/secret-keys/)).
- ACTION_HANDLERS - add `civicrm-addgroup` and `civicrm-addtag` to enable the "Add to Group" and "Add tag to Contact" handlers respectively

## Optional configurations

