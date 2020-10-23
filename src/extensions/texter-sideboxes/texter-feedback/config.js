import React from "react";
import { FlatButton } from "material-ui";
import LinkIcon from "material-ui/svg-icons/content/link";

export const issues = [
  {
    key: "optOut",
    tooltip: "Texter misses an Opt-Out or incorrectly Opts Out a contact",
    warningMessage: "Please review the Opt-Out Policy",
    content: (
      <p>
        At WFP, we <b>DO</b> Opt Out voters who ask to be removed from texting
        (“Stop,” “please remove my number,” “don’t text me,” “unsubscribe”) or
        who send racist, sexist, or threatening replies. We <b>DO NOT</b> Opt
        Out voters who disagree with our views, simply send profanity, or who
        update their information with us (e.g. letting us know that they moved,
        that we have the wrong number, etc).
        <br />
        <br />
        <FlatButton
          label="More Info"
          target="_blank"
          secondary
          icon={<LinkIcon />}
          href="https://docs.google.com/document/d/1Bi5ZBe4B1ctj4JoyxLh1GY36HwurfYFV6ZlP_2Veu-4/edit?ts=5f849e19#heading=h.6a3kq2vmqjfl"
        />
      </p>
    )
  },
  {
    key: "tagging",
    tooltip: "Texter misses a Tag or incorrectly Tags a contact",
    warningMessage: "Issue with Tagging",
    content: (
      <p>
        Please make sure that you are using tags for all updates to voter
        information like <b>Wrong Number, Out of District, and Cannot Vote</b>.
        That is a three step process to select the tag, save the tags, and then
        send the appropriate response.
        <br />
        <br />
        <FlatButton
          label="More Info"
          target="_blank"
          secondary
          icon={<LinkIcon />}
          href="https://docs.google.com/document/d/1Bi5ZBe4B1ctj4JoyxLh1GY36HwurfYFV6ZlP_2Veu-4/edit?ts=5f849e19#heading=h.tv4n9bpi3n0"
        />
      </p>
    )
  },
  {
    key: "response",
    tooltip:
      "Texter should have selected a better response or inappropriately skipped a message (please elaborate in notes)",
    warningMessage:
      "Please review our priority of responses and “skipping” policy",
    successMessage: "Nice work selecting the best responses!",
    content: (
      <p>
        When a voter gives lots of information,{" "}
        <b>please remember our Priority of Responses! </b>
        If the voter answered the question at hand, send a Survey Response (the
        top list in the All Responses dropdown). When we send a Survey Response,
        the system also logs data for that conversation. Other Responses are
        used if none of the Survey Responses are appropriate.
        <br />
        <br />
        Lastly, we only Skip messages if the conversation has come to an end,
        when tagging Help Needed, when a voter is currently driving, or to end a
        conversation with a non-supporter or troll. If multiple Survey Responses
        fit the situation and you’re not sure when Response to send, the higher
        response is likely the right choice.
        <br />
        <br />
        <FlatButton
          label="More Info"
          target="_blank"
          secondary
          icon={<LinkIcon />}
          href="https://docs.google.com/document/d/1Bi5ZBe4B1ctj4JoyxLh1GY36HwurfYFV6ZlP_2Veu-4/edit?ts=5f849e19#heading=h.1nzxdmspjlv3"
        />
      </p>
    )
  },
  {
    key: "scriptEdit",
    tooltip:
      "Texter edited a message in a way that exceeds the character limit, ignores the ask, or uses an inappropriate source",
    warningMessage: "Please review our guidelines for editing messages",
    content: (
      <p>
        Let’s stick to the scripted responses as much as possible! If a scripted
        message will not address the particular issue, make sure to always
        include the appropriate ask at the end of the message and make sure the
        source of your information is coming from an official campaign source or
        local government source for voter information. Let’s also limit our
        message to 306 characters or less.
        <br />
        <br />
        <FlatButton
          label="More Info"
          target="_blank"
          secondary
          icon={<LinkIcon />}
          href="https://docs.google.com/document/d/1Bi5ZBe4B1ctj4JoyxLh1GY36HwurfYFV6ZlP_2Veu-4/edit?ts=5f849e19#heading=h.rdzii9tlwurh"
        />
      </p>
    )
  },
  {
    key: "engagement",
    tooltip:
      "Texter missed engaging with an undecided voter or supporter OR inappropriately engaged with a non-supporter.",
    warningMessage:
      "Engage with questions from supportive voters; NOT non-supporters!",
    successMessage: "Your messages showed good engagement with voters!",
    content: (
      <p>
        Let’s use our judgement about when to engage. If an undecided voter or a
        supporter asks questions, we should address those questions to the best
        of our ability. If a non-supporter or troll messages, please disengage,
        send the Nonsupporter response (or Refused for trolls), and skip future
        messages from this contact.
        <br />
        <br />
        <FlatButton
          label="More Info"
          target="_blank"
          secondary
          icon={<LinkIcon />}
          href="https://docs.google.com/document/d/1Bi5ZBe4B1ctj4JoyxLh1GY36HwurfYFV6ZlP_2Veu-4/edit?ts=5f849e19#heading=h.t2f4xaxmvq10"
        />
      </p>
    )
  }
];

export const skills = [
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
    key: "undecided",
    content:
      "Undecided - texter sent Undecided response for vague asks of more info",
    successMessage:
      "Nice work identifying undecided voters and engaging with the Undecided Survey Response!"
  },
  {
    key: "persuasiveNo",
    content: "Texter sent No Vague for vague “No” replies",
    successMessage:
      "Nice work sending the No VAGUE Survey Response to engage with vague voters!"
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
      "Nice job composing a message when the script didn’t quite fit; you stayed within the 306 character limit and stuck to the ask!"
  }
];
