import React from "react";
import { FlatButton } from "material-ui";
import LinkIcon from "material-ui/svg-icons/content/link";

export const defaults = {
  description: "defaults",
  issues: [
    {
      key: "optOut",
      tooltip: "Texter misses an Opt-Out or incorrectly Opts Out a contact",
      warningMessage: "Please review the Opt-Out Policy",
      content:
        "Opt Out contacts who ask to be removed from texting (“Stop,” “please remove my number,” “don’t text me,” “unsubscribe”) or other responses you have been instructed to opt out."
    },
    {
      key: "tagging",
      tooltip: "Texter misses a Tag or incorrectly Tags a contact",
      warningMessage: "Issue with Tagging",
      content:
        "Please make sure that you are using tags as documented. There is a three step process to select the tag, save the tags, and then send the appropriate response."
    },
    {
      key: "response",
      tooltip:
        "Texter should have selected a better response or inappropriately skipped a message (please elaborate in notes)",
      warningMessage: "Be careful to pick the correct available response",
      successMessage: "Nice work selecting the best responses!",
      content:
        "When a contact gives lots of information, if they answered the question at hand respond with the best option that's first in the list of All Responses (or on a button). Using the responses available allows us to track their answers."
    },
    {
      key: "scriptEdit",
      tooltip:
        "Texter edited a message in a way that ignores the ask, or uses an inappropriate source",
      warningMessage: "Please review our guidelines for editing messages",
      content:
        "Let’s stick to the scripted responses as much as possible! If a scripted message will not address the particular issue, make sure to always include the appropriate ask at the end of the message and verify any information included using authoritative sources."
    },
    {
      key: "engagement",
      tooltip:
        "Texter missed engaging with an undecided voter or supporter OR inappropriately engaged with a non-supporter.",
      warningMessage:
        "Engage with questions from supportive responses; NOT non-supporters!",
      successMessage: "Your messages showed good engagement!",
      content:
        "Let’s use our judgement about when to engage. If a supportive contact asks questions, we should address those questions to the best of our ability. If a troll messages, please follow direction."
    }
  ],
  skills: [
    {
      key: "extraOptOut",
      content: "Texter identifies a nestled opt out request ",
      successMessage:
        "  Sometimes a request to Opt Out is hidden among other info, but you saw it and stuck to our Opt Out policy. Nice!"
    },
    {
      key: "tagging",
      content: "Appropriate use of tags",
      successMessage:
        "Nice job identifying updates to voter info, tagging, and saving tags!"
    },
    {
      key: "jumpAhead",
      content: "Texter logs multiple Survey Response at once",
      successMessage:
        "This is a big Level-Up skill! You logged multiple Survey Responses at once when the voter answered the next question in the script!"
    },
    {
      key: "multiMessage",
      content: "Texter sends multiple responses with attention to convo flow",
      successMessage:
        "Nice work sending multiple responses when answering a voter’s questions and for paying attention to the flow of the conversation!"
    },
    {
      key: "composing",
      content: "Texter restates ask and stays w/in char limit when composing",
      successMessage:
        "Nice job composing a message when the script didn’t quite fit; you stayed within the recommended character limit and stuck to the ask!"
    }
  ]
};
