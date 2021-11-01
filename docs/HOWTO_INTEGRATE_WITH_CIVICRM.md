# How to Integrate with CiviCRM

## Introduction

CiviCRM is a web-based, highly customizable CRM released under the GNU AGPL v3 license. It is used by a diverse range of organizations around the world.

## Available integrations

### Contact Loader

Load contacts from CiviCRM groups directly into a Spoke campaign. The loader retrieves the following data by default:
- CiviCRM contact ID
- first name
- last name
- zip/post code
- mobile phone

The loader can be configured to import additional fields through the use of Spoke environment variables (see below).

### Action Handlers

Add to Group - add a contact to a specified CiviCRM group from within a Spoke conversation
Add tag to Contact - add a tag to a contact in CiviCRM from within a Spoke conversation
Register for Event - register a person for an event in CiviCRM

These handlers require the CiviCRM contact loaader be configured and available for use.

## Instructions

### Step One - creating an API key for CiviCRM

Integration with CiviCRM requires the creation of an API key, bound to a specific contact record or user account in CiviCRM, with suitable permissions.
The [CiviCRM System Administration guide](https://docs.civicrm.org/sysadmin/en/latest/setup/api-keys/) includes instructions on how to create an API key.

### Step Two - making sure your variables are set in your production/development deployment environment

Modify your Spoke .env file to include the following environment variables:

- CONTACT_LOADERS - add `civicrm` to the comma-separated list
- CIVICRM_API_URL - should be the full URL of the [CiviCRM REST API](https://docs.civicrm.org/dev/en/latest/api/v3/rest/)
  (eg. https://example.com/sites/all/modules/civicrm/extern/rest.php)
- CIVICRM_API_KEY - the key you generated in step one
- CIVICRM_SITE_KEY - the site key for your CiviCRM installation. Defined in your `civicrm.settings.php` file ([more info](https://docs.civicrm.org/sysadmin/en/latest/setup/secret-keys/)).
- ACTION_HANDLERS - add `civicrm-addtogroup`, `civicrm-addtag` and `civicrm-registerevent` to enable the "Add to Group", "Add tag to Contact" and "Register for Event" handlers respectively

## Optional contact loader configuration

The CiviCRM contact loader offers two optional customizations to support additional requirements you may have.

### Additional custom data
The environment variable `CIVICRM_CUSTOM_DATA` can be used to specify additional data fields you wish to retrieve from CiviCRM.

By default, these attributes must be directly "attached" to a person's Contact record in CiviCRM and retrievable via CiviCRM's API interface when making a `Contact.get` API call.

Some examples include:
- `birth_date`
- `formal_title`
- `nick_name`

Simply declare the variable `CIVICRM_CUSTOM_DATA` and ensure it contains a comma-separated list of field names (without spaces).

Custom fields you may have created for Contact records in CiviCRM are also retrievable. CiviCRM's API references those fields using the `custom_xxx` syntax.
To make these fields human-readable (especially useful when used as tokens), you can define a label for them in the environment variable.

For example:
`CIVICRM_CUSTOM_DATA=custom_203:congressionalDistrict,custom_204:congressionalRep,middle_name,birth_date`

### Custom API call
In more complex cases, data you wish to retrieve may not be "attached" to Contact records in CiviCRM. An example might be data attached to a related entity such as a membership record.

One way of solving this problem is to create a CiviCRM extension that defines a new API action for the Contact entity that compiles all the desired data and returns it to Spoke.

In such a scenario, you can then use the `CIVICRM_CUSTOM_CONTACT_ACTION` variable in your Spoke installation to tell the CiviCRM contact loader to query CiviCRM's API via this action instead of the default `Contact.get`.

For example:
`CIVICRM_CUSTOM_CONTACT_ACTION=getspokedata` would generate a `Contact.getspokedata` request to the CiviCRM API.
