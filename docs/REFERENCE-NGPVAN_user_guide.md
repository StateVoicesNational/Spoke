# NGPVAN Integration User Guide

- [Introduction](#introduction)
- [Getting Started and Requesting an API Key](#getting-started-and-requesting-an-api-key)
- [The Contact Loader](#the-contact-loader)
- [The Action Handler](#the-action-handler)
- [The Message Handler](#the-message-handler)

## Introduction

This is a user guide for integrating with VAN. Though the integration is referred to in the code as 'ngpvan', the integration is only supported for VAN, not the separate NGP product that is used for donation tracking and digital outreach. However, the integration does support using either MyCamapign or MyVoters modes in VAN.


## Getting Started and Requesting an API Key

To request an API Key, go to the API integrations page from the sidebar menu, and click request API key. Request a 'Spoke Main Branch' API key.

You can use this integration with one API key for your whole Spoke build, or with different API keys for each organization in a multi-organization setup. Either way, you will likely want to set `NGP_VAN_WEBHOOK_BASE_URL` globally to the base URL for wherever you host spoke (i.e. the same value as `BASE_URL`).

### Setting a single API key for your whole build

Set the NGP_VAN_API_KEY environment variable to your API key, and the NGP_VAN_APP_NAME to the associated user name (usually something like NY001.spoke.api or similar).

If you are using Redis, you may need to clear the cache when you add or make changes to the API key; you can do this from your Redis CLI with FLUSHDB (though this is not recommended in the middle of high amounts of active use) or by deleting the in individual associate keys [TODO: what are the proper keys to clear here?]

### Using different API keys for each organization

You can set individual API keys for some or all of your organizations by editing the features column in the organziation table of your database directly. This column is in JSON format so if no other features are set for the organization, you would set the value to 

{"NGP_VAN_API_KEY":"[key]", "NGP_VAN_APP_NAME":"[app_name]"}

After saving this change in your database, if you are using Redis, you should clear the cache for this organization by going to Settings in Spoke and clicking the "Clear Cached Organization and Extension Caches"
button.

When organizations do not have these variables individually set, if these variables are globally set, Spoke will fall back to using those credentials.

## The Contact Loader

The contact loader allows you to choose a saved list (but not a saved search) in VAN as your contact source. All the fields that are available for your contacts in VAN will be available for personalization in Spoke, including handy things like polling location and district (though those fields will of course only be as accurate as they were in VAN). To use the contact loader, ngpvan must appear in the list in your CONTACT_LOADERS envirornment variable.

Loading lists from VAN in Spoke does <b>not</b> involve the SMS button in VAN. Instead, make a folder or folders in VAN where you plan to save the lists you would like to use. Edit that folder, and give the API User for the key you requested access to that folder as you would any other user. Going forward, any list you save to that folder will show up in Spoke--select NGPVAN as the Contact Load Method and start typing the list name, then select it from the typeahead when it appears.

### Contact Loader Troubleshooting

Can't find your list? These are common reasons folks run into issues:

* Is this a saved list, and not a saved search?
* Did you save it in a folder where the proper API user has access?
* If the list is over 75,000 people, it will not appear by default. You can cut it into smaller lists, or change the maximum list size by changing NGP_VAN_MAXIMUM_LIST_SIZE. For large lists, you also run a bigger risk of the request to VAN to load the list timing out; you can change the maximum timeout length with NGP_VAN_TIMEOUT.
* If none of the above issues seem to apply in your case, there may be a caching issue, particularly if you just set up the VAN integration. Clearing the cache in Settings --> External configuration sometimes helps, as does logging out and back in.

## The Action Handler

The action handler allows you to sync data back to VAN as part of your script. Data saves to VAN are triggered in the same way answers to questions you incorporate in your script are saved in Spoke, i.e. when the texter selects an answer to a question you have constructed, and then sends a subsequent message, clicks Skip, or opts the contact out. To use the action handler, ngpvan must appear in the list in your ACTION_HANDLERS envirornment variable.

For each question answer, you can select an appropriate action by selecting NGPVAN from the dropdown and starting to type. Your options will be drawn from Canvass Response Codes, Activist Codes, and Survey Question answers you have set up in VAN.

An important note: by far the easiest way to use the Action Handler is when you are also using the Contact Loader. If you are loading the list from a CSV, take care to have the VANID in a column called either VanID or vanid. Other capitalization/punctuation will cause the data to not sync properly.

## The Message Handler

The message handler will simply mark every contact you message as messaged in VAN, in that contact's Contact History. By default the contact result will be 'Texted' but this can be modified via changing DEFAULT_NGP_VAN_INITIAL_TEXT_CANVASS_RESULT in your environment variables. To use the message handler, ngpvan must appear in the list in your MESSAGE_HANLDERS environment variable, <b>and</b> you must be using the NGPVAN action handler (see above, including the caveat about using the handlers when loading from a CSV).