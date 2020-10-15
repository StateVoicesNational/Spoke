import React from "react";

export default [
  {
    key: "optOuts",
    warningMessage: "Please review the Opt-Out Policy",
    successMessage: "You had no issues with Opt-Outs!",
    content: (
      <p>
        At WFP, we <b>DO</b> Opt Out voters who ask to be removed from texting
        (“Stop,” “please remove my number,” “don’t text me,” “unsubscribe”) or
        who send racist, sexist, or threatening replies. We <b>DO NOT</b> Opt
        Out voters who disagree with our views, simply send profanity, or who
        update their information with us (e.g. letting us know that they moved,
        that we have the wrong number, etc). {"More Info"}
        <a href="https:://wfpus.org/TextFAQ">wfpus.org/TextFAQ</a>
      </p>
    )
  },
  {
    key: "tags",
    warningMessage: "Issue with Tagging",
    successMessage: "Nice work applying appropriate tags!",
    content: (
      <p>
        Please make sure that you are using tags for all updates to voter
        information like <b>Wrong Number, Out of District, and Cannot Vote</b>. 
        That is a three step process to select the tag, save the tags, and then 
        send the appropriate response. 
      </p>
    )
  },
  {
    key: "responses",
    warningMessage: "Please review our priority of responses and “skipping” policy.",
    successMessage: "Nice work selecting the best responses!",
    content: (
      <p>
        When a voter gives lots of information,{" "}
        <b>please remember our Priority of Responses!</b> If the voter answered the question at hand, send a Survey Response (the top list in the All Responses dropdown). When we send a Survey Response, the system also logs data for that conversation. Other Responses are used if none of the Survey Responses are appropriate. Lastly, we only Skip messages if the conversation has come to an end, when tagging Help Needed, when a voter is currently driving, or to end a conversation with a non-supporter or troll.  If multiple Survey Responses fit the situation and you’re not 
        sure when Response to send, the higher response is
        likely the right choice.
      </p>
    )
  },
  {
    key: "scriptEdit",
    warningMessage: "Please review our guidelines for editing messages.",
    successMessage: "You made the right asks and provided accurate info!",
    content: (
      <p>
        Let’s stick to the scripted responses as much as possible! If a scripted message will not address the particular issue, make sure to always include the appropriate ask at the end of the message and make sure the source of your information is coming from an official campaign source or local government source for voter information. Let’s also limit our message to 306 characters or less. 
      </p>
    )
  },
  {
    key: "engagement",
    warningMessage: "Please DO engage with undecided voters and supporters, and DO NOT engage from non-supporters and trolls.",
    successMessage: "Your messages showed good engagement with voters!",
    content: (
      <p>
        Let’s use our judgement about when to engage. If an undecided voter or a supporter asks questions, we should address those questions to the best of our ability. If a non-supporter or troll messages, please disengage, send the Nonsupporter response (or Refused for trolls), and skip future messages from this contact. 
      </p>
    )
  },
];
