# Best Practices on Conformance and Messaging

- [Introduction](#introduction)
- [One click or keypress per-message](#one-click-or-keypress-per-message)
- [Opting out](#opting-out)
- [Modifying the initial text message](#modifying-the-initial-text-message)
- [Blocking inappropriate texter content](#blocking-inappropriate-texter-content)

## Introduction

Spoke is a software application that facilitates individual texters sending individual messages to contacts and continuing having a conversation. This is usually described as “Peer-to-Peer” or “Person-to-Person” communication.  While software (just like all the ways we communicate these days) is involved, Spoke is not an “Application-to-Person” tool.

Use of Spoke is subject to legal restrictions which each organization should review and understand, including recent guidance from an [FCC ruling](https://docs.fcc.gov/public/attachments/DA-20-670A1.pdf). Carriers and messaging services also take positions both on what is legally allowed and how they interpret messages sent through their services.  Twilio documents [how carrier filtering works](https://support.twilio.com/hc/en-us/articles/223181848-How-Does-Carrier-Filtering-Work-), and a carrier industry group has published [CTIA guidelines](https://www.ctia.org/the-wireless-industry/industry-commitments/messaging-interoperability-sms-mms) that describe carrier perspectives.

MoveOn aggressively works to follow best practices to be legally compliant as well as a good citizen for texters and contact recipients.

<b><i><u>Please consult your own legal advice on how to deploy Spoke.</u></i></b> Because Spoke is used by different organizations, in different countries, with different compliance laws and interpretations, Spoke allows for adjustment of the configuration options.  Please consult with legal counsel as to how your organization should configure Spoke.

While other configurations are possible, they can only be deployed and changed by system administrators -- it is essentially the same as <b>substantially</b> “changing the code” to use Spoke modified for these purposes.  These configurations cannot be changed by campaigners or texters that simply login to the system.

This document is meant to detail the default configurations and how as a system administrator you can change the defaults. It describes settings as of Spoke 8.0.

## One click or keypress per-message

Spoke’s default requires the texter to make a single click or key-press for each message sent. Each time a texter presses a key or clicks their mouse button from their queued list of contacts, it will send another message. Spoke cannot send a message unless an individual clicks or presses a key.

### Use cases for sending fewer messages:

* Some have requested a feature to require two clicks instead of a single click per-message.  For replies, there are always two clicks because a reply must be typed or chosen and then the message is sent with a second click. For initial messages, system administrators can set TEXTER_TWOCLICK=1 and two key or mouse clicks will be required for each message sent.

### Use cases for sending more messages:

* If you are using Spoke in a <b>subscriber-only</b> context, you can enable ALLOW_SEND_ALL=1 and enable the option in the organization’s Settings screen to allow Spoke to send all initial messages at once from a single click. This was implemented for an Australian compliance context (in 2017).

  Operational note: When enabling the setting in the application it will show the following text:

  * You are turning on ALLOW_SEND_ALL mode, which means Spoke will be substantially altered from its default configuration.  <b><i>PLEASE CONSULT WITH LEGAL COUNSEL BEFORE YOU ALTER THIS VARIABLE TO ENSURE THAT YOUR USE OF SPOKE IS COMPLIANT WITH APPLICABLE LAW IN YOUR JURISDICTION FOR PERSON-TO-PERSON TEXTING. </i></b>


## Opting out

Spoke maintains a list of opt-outs from contacts in the table opt_out. All contacts uploaded that have the same number as an past opt-out record are removed before contacts can be texted.  

Spoke has “multi-tenant” features where multiple “organizations” can use the same instance -- often a single organization will use multiple Spoke organizations for different texting programs. In this case, it is possible for organizations across the system to share all their opt-outs. You can set this with OPTOUTS_SHARE_ALL_ORGS=1.

Twilio and some other messaging service providers have some compliance features when standard messages to opt-out (e.g. “STOP”) are received, where these service providers opt-out the contact themselves, and make it impossible for you to text them again.  Previously, Spoke depended on this and texters manually marking contacts that opted out by reading their messages.  This is still an important part of the process.

Additionally, you can enable a Spoke setting MESSAGE_HANDLERS=auto-optout (not default). If phrases are matched in the message received, the contact is automatically opted-out, similar to the Twilio service behavior without any reply to the contact. This saves much manual (and sometimes emotional) labor for texters.

The default set of phrases that automatically opt-out the contact include (single words are activated only if the text begins with that word):

   stop, unsubscribe, cancel, end, quit, remove me, remove my name, take me off the list, lose my number, delete my number


You can modify what triggers an auto-optout by preparing JSON in the following structure and then running in a node.js prompt Buffer.from(jsonString).toString(‘base64’) and setting the value of AUTO_OPTOUT_REGEX_LIST_BASE64 to that. (make sure it is valid json and valid regular expressions!).  The default setting is:
    ```
    [{"regex": "^\\\\s*stop\\\\b|\\\\bremove me\\\\s*$|remove my name|\\\\btake me off th\\\\w+ list|\\\\blose my number|delete my number|^\\\\s*unsubscribe\\\\s*$|^\\\\s*cancel\\\\s*$|^\\\\s*end\\\\s*$|^\\\\s*quit\\\\s*$", "reason": "stop"}]
    ```

You can add multiple objects in the array to match different reasons. The default Spoke install does not include all the phrases MoveOn uses to trigger an auto-optout -- we also include offensive/hostile phrases, for example.


## Modifying the initial text message

Spoke defaults to allowing texters to alter the initial message. This default setup is with TEXTER_SIDEBOXES=default-editinitial which adds a sidebox to the texter window where they can click a link to edit the message. This component also includes some guidance on the texter’s responsibilities.

While texters should be able to send messages they desire, administrators can change how many contacts are assigned to a texter if they are going off-script in a manner that an organization does not allow for its program. You can enable a setting (not default), MESSAGE_HANDLERS=initialtext-guard to make it so a texter (not marked “Vetted” or with a higher role in the system) sends an off-script initial message, the message is sent, but other contacts are removed from that texter to be sent by other texters and the message is marked with error_code=-167 for review. 


## Blocking inappropriate texter content
Some language should not be possible to be texted out. This includes racial and misogynistic slurs, for example. Not on by default, but we recommend to consider enabling MESSAGE_HANDLERS=profanity-tagger along with PROFANITY_TEXTER_BLOCK_SEND=1:

* PROFANITY_TEXTER_REGEX_BASE64 controls which phrases are blocked with a regular expression.  You can see the default (encoded) in the [Spoke profanity-tagger code base](https://github.com/MoveOnOrg/Spoke/blob/main/src/integrations/message-handlers/profanity-tagger/index.js#L4). Take care to thoroughly test your regular expression before deploying a change.


