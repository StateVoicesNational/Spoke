import React from "react";

export default [
  {
    key: "optOuts",
    warningMessage: "Please review the Opt-Out Policy",
    successMessage: "You had no issues with Opt Outs!",
    content: (
      <p>
        At WFP, we <b>DO</b> Opt Out voters who ask to be removed from texting
        (“Stop,” “please remove my number,” “don’t text me,” “unsubscribe”) or
        who send racist, sexist, or threatening replies. We <b>DO NOT</b> Opt
        Out voters who disagree with our views, simply send profanity, or who
        update their information with us (e.g. letting us know that they moved,
        that we have the wrong number, etc). Please take a look at the texter
        FAQ for a refresher at{" "}
        <a href="https:://wfpus.org/TextFAQ">wfpus.org/TextFAQ</a>.
      </p>
    )
  },
  {
    key: "tags",
    warningMessage: "Incorrect Use of Tags",
    successMessage: "You had no issues with applying tags!",
    content: (
      <p>
        Please make sure that you are using tags for all updates to voter
        information like Wrong Number, Out of District, and Cannot Vote. That is
        a three step process to select the tag, save the tags, and then send the
        appropriate response. If you have multiple tags and you’re not sure when
        Other Response to send, the higher response (with the lower number) is
        likely the right choice.
      </p>
    )
  },
  {
    key: "responses",
    warningMessage: "Remember Priority of Responses",
    successMessage: "You had no issues with choosing correct responses!",
    content: (
      <p>
        When a voter gives lots of information,{" "}
        <b>please remember our Priority of Responses!</b> Opt out is first
        priority, then select and save any appropriate tags, then if the voter
        answered the question at hand send a Survey Response (the top list in
        the All Responses dropdown). Other Responses are a last resort.
      </p>
    )
  },
  {
    key: "script",
    warningMessage: "Missing Ask or Included Unofficial Info",
    successMessage: "You made the risk asks and provided accurate info!",
    content: (
      <p>
        Let’s stick to the scripted responses as much as possible! If a scripted
        message will not address the particular issue, make sure to always
        include the appropriate ask at the end of the message and make sure the
        source of your information is coming from an official campaign source or
        local government source for voter information.
      </p>
    )
  },
  {
    key: "length",
    warningMessage: "Messages That Are Too Long",
    successMessage: "Your messages weren't too long!",
    content: (
      <p>
        When a voter asks questions that require a response greater than 306
        characters, we want to send consecutive messages, ensure that we log a
        Survey Response if the voter answered the question at hand, and include
        the ask at the end of the last message sent! If possible, let’s keep all
        responses to 306 characters or less.
      </p>
    )
  },
  {
    key: "skips",
    warningMessage: "Skipped Messages That Need a Response",
    successMessage: "You only skipped messages when appropriate!",
    content: (
      <p>
        I see a conversation that needed a response but was skipped. Please know
        that we only use the Skip button when a conversation has ended, when
        tagging Help Needed, or when we receive an automated “I’m Driving”
        message.
      </p>
    )
  }
];
