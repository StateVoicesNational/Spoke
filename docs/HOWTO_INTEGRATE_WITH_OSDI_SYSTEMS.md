# How to integrate with OSDI-compliant systems

This document describes how to enable integration with OSDI-compliant systems such as VAN or Action Network. [OSDI](https://opensupporter.github.io/osdi-docs/) is specification that allows progressive campaign tech tools share data using a standardized format.

## Currently supported integrations

Currently, Spoke supports one OSDI integration: the `record_canvass_helper`, which allows questions and responses in a Spoke campaign script to be "mapped" to OSDI Answer and Canvass resources. In practice, this means that you can "import" questions from an OSDI-compliant system, and when your volunteers record contacts' responses to them, those responses will be "synced" back into the originating system.

This integration has been tested with VAN, but still needs testing with other OSDI-compliant systems. If you can help with this, [please let us know](/CONTRIBUTING.md).

## Planned integrations

- `record_attendance_helper` (to allow Spoke responses to automatically RSVP contacts to events)
- Lists (to allow importing contacts to a Spoke campaign directly from an OSDI-compliant system, rather than requiring them to be exported and then re-uploaded first. Some development has already been done in this area.)

If there are other integrations your org would like to see, please let us know!

<h2 id="configuration">Configuring Spoke to connect to your OSDI system</h2>

To use the OSDI integrations, you need an OSDI API token for your system. See your system's documentation for details on how to get one ([Action Network help](https://help.actionnetwork.org/hc/en-us/articles/203113599-How-do-I-access-the-Action-Network-API-), [VAN help](https://developers.ngpvan.com/)). Once you have that key, go the Spoke settings and toggle the "Enable OSDI integrations" switch. Enter the API base URL and token, and click save.

## Using the integrations

### `record_canvass_helper`

Once you have [configured Spoke to connect to your OSDI system](#configuration), a new module will appear in the "Interactions" section of campaign creation. Under the "Question" field in each interaction step, you'll see a menu letting you choose a question from your OSDI system. Selecting a question displays the full text of the question and its responses. When you click the "Map" button, two things happen:

  1. The "Question" field is automatically set to the text of the question, and becomes uneditable. Note that you still need to enter a script – the text that will actually be sent to contacts – by hand. The "Question" text is what is displayed to your texters.
  2. A new response to this question in the script is created for each response to the OSDI question. These responses have the "OSDI survey response" action selected, and their Answer and Action fields are uneditable. If you want to create additional interaction steps (for example, asking a follow-up question based on their response to the first one), you can still do that normally, by entering a Script and a Question. You can even map another OSDI question here!

When your texters mark a contact's response to a mapped OSDI question, the response is sent to the OSDI system. If you experience errors, or if responses are not being synced, check your API credentials, then check the server logs for details.

__Important note:__ selecting the "OSDI survey response" action on an existing response _has no effect_. When you map a question, Spoke records the OSDI system's question and response IDs, which are used to sync the responses later. If you select the "OSDI survey response" action by hand, Spoke won't have that information and therefore can't sync the responses. Currently, __the only way to use the OSDI question integration__ is with the mapping interface.
