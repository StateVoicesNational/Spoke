import PropTypes from "prop-types";
import React from "react";
import { StyleSheet, css } from "aphrodite";
import ContactToolbarNew from "../components/ContactToolbarNew";
import MessageList from "../components/MessageList";
import CannedResponseMenu from "../components/CannedResponseMenu";
import AssignmentTexterSurveys from "../components/AssignmentTexterSurveys";
import ScriptList from "./ScriptList";
import Empty from "../components/Empty";
import GSForm from "../components/forms/GSForm";
import RaisedButton from "material-ui/RaisedButton";
import FlatButton from "material-ui/FlatButton";
import IconButton from "material-ui/IconButton/IconButton";
import { Card, CardActions, CardTitle } from "material-ui/Card";
import Divider from "material-ui/Divider";
import CreateIcon from "material-ui/svg-icons/content/create";
import DownIcon from "material-ui/svg-icons/navigation/arrow-drop-down";
import yup from "yup";
import theme from "../styles/theme";
import Form from "react-formal";
import Popover from "material-ui/Popover";

const bgGrey = "rgb(214, 215, 223)";

import {
  getChildren,
  getAvailableInteractionSteps,
  getTopMostParent,
  interactionStepForId,
  log,
  isBetweenTextingHours
} from "../lib";

import { dataTest } from "../lib/attributes";

const messageListStyles = {
  // passesd directly to <MessageList>
  messageList: {
    flex: "2 4 auto",
    overflow: "hidden",
    overflow: "-moz-scrollbars-vertical",
    maxWidth: "574px"
  },
  messageSent: {
    textAlign: "right",
    marginLeft: "20%",
    marginRight: "10px",
    backgroundColor: "white",
    borderRadius: "16px",
    marginBottom: "10px",
    fontSize: "95%"
  },
  messageReceived: {
    marginRight: "20%",
    marginLeft: "10px",
    color: "white",
    backgroundColor: "hsla(206, 99%, 31%, 0.74)", //#01579B",
    borderRadius: "16px",
    //fontWeight: "600",
    fontSize: "110%",
    lineHeight: "120%",
    marginBottom: "10px"
  }
};

const inlineStyles = {
  inlineBlock: {
    display: "inline-block"
  },
  exitTexterIconButton: {
    float: "left",
    padding: "3px",
    height: "56px",
    zIndex: 100,
    top: 0,
    left: "-12px"
  },
  flatButtonLabel: {
    textTransform: "none",
    fontWeight: "bold"
  }
};

const flexStyles = StyleSheet.create({
  topContainer: {
    margin: 0,
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    display: "flex",
    flexDirection: "column",
    height: "100%",
    backgroundColor: bgGrey
  },
  popover: {
    width: "85%",
    height: "85%",
    "@media(min-height: 800px)": {
      // if it's too tall, the current question options are too far away
      height: "50%"
    }
  },
  popoverLink: {
    float: "right",
    width: "4em",
    marginRight: "2em",
    fontWeight: "normal",
    fontSize: "80%"
  },
  popoverLinkColor: {
    color: "rgb(81, 82, 89)"
  },
  sectionHeaderToolbar: {
    flex: "0 0 auto"
  },
  /// * Section Scrolling Message Thread
  sectionMessageThread: {
    flex: "1 2 auto",
    overflowY: "scroll",
    overflow: "-moz-scrollbars-vertical",
    overflowX: "hidden",
    backgroundColor: "#f0f0f0"
  },
  /// * Section OptOut Dialog
  sectionOptOutDialog: {
    padding: "4px 10px 9px 10px",
    zIndex: 2000,
    backgroundColor: "white",
    "@media (hover: hover) and (pointer: fine)": {
      // for touchpads and phones, the edge of the tablet is easier
      // vs for desktops, we want to maximize how far the mouse needs to travel
      maxWidth: "554px"
    }
  },
  subSectionOptOutDialogActions: {
    marginTop: 20,
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-end"
  },
  /// * Section Texting Input Field
  sectionMessageField: {
    // messageField
    flex: "1 0 20px",
    padding: "0px 4px",
    marginBottom: "8px",
    backgroundColor: "white"
  },
  subSectionMessageFieldTextField: {
    "@media(max-width: 350px)": {
      overflowY: "scroll !important"
    }
  },
  /// * Section Reply/Exit Buttons
  sectionButtons: {
    // TODO: maybe make this contingent on whether there are answer buttons
    "@media(max-height: 600px)": {
      flexBasis: "96px" // TODO
    },
    "@media(min-height: 600px)": {
      flexBasis: "144px" // TODO
    },
    flexGrow: "0",
    flexShrink: "0",
    // flexBasis: ${130px|190px}", // stretches and shrinks more quickly than message
    flexDirection: "column",
    display: "flex",
    // flexWrap: "wrap",
    overflow: "hidden",
    position: "relative",
    backgroundColor: bgGrey
  },
  subButtonsAnswerButtons: {
    flex: "1 1 80px", // keeps bottom buttons in place
    // height:105: webkit needs constraint on height sometimes
    //   during the inflection point of showing the shortcut-buttons
    //   without the height, the exit buttons get pushed down oddly
    height: "15px", //TODO
    // internal:
    margin: "9px 0px 0px 9px",
    width: "100%"
    // similar to 572 below, but give room for other shortcut-buttons
  },
  subSubButtonsAnswerButtonsCurrentQuestion: {
    marginBottom: "12px",
    //flex: "0 0 auto",
    width: "100%",
    // for mobile:
    whiteSpace: "nowrap",
    overflow: "hidden"
  },
  subSubAnswerButtonsColumns: {
    height: "0px",
    "@media(min-height: 700px)": {
      height: "40px" // TODO
    },
    display: "inline-block",
    //flex: "1 1 50%",
    overflow: "hidden",
    position: "relative"
  },
  subButtonsExitButtons: {
    // next/prev/skip/optout
    // width: "100%", default is better on mobile
    height: "40px",
    margin: "9px",
    // default works better for mobile right margin
    // flex: "0 0 40px",
    // internal:
    display: "flex",
    flexDirection: "column",
    flexWrap: "wrap",
    alignContent: "space-between",
    // to 'win' against absoslute positioned content above it:
    backgroundColor: bgGrey,
    zIndex: "10",
    "@media (hover: hover) and (pointer: fine)": {
      // for touchpads and phones, the edge of the tablet is easier
      // vs for desktops, we want to maximize how far the mouse needs to travel
      maxWidth: "554px"
    }
  },
  /// * Section Send Button
  sectionSend: {
    //sendButtonWrapper
    flex: `0 0 auto`,
    height: "36px",
    display: "flex",
    flexDirection: "column",
    flexWrap: "wrap",
    alignContent: "space-between",
    padding: "9px",
    "@media (hover: hover) and (pointer: fine)": {
      // for touchpads and phones, the edge of the tablet is easier
      // vs for desktops, we want to maximize how far the mouse needs to travel
      maxWidth: "554px"
    }
  },
  subSectionSendButton: {
    flex: "1 1 auto",
    width: "70%",
    height: "100%",
    //borderRadius: "0px",
    color: "white"
  },
  flatButton: {
    height: "40px",
    border: "1px solid #949494",
    // FlatButton property, setting here, overrides hover
    // backgroundColor: "white",
    borderRadius: "0",
    boxShadow: "none",
    maxWidth: "300px",
    "@media(max-width: 450px)": {
      // mobile crunch
      minWidth: "auto"
    }
  },
  flatButtonLabelMobile: {
    "@media(max-width: 327px)": {
      // mobile crunch
      display: "none"
    }
  }
});

export class AssignmentTexterContactControls extends React.Component {
  constructor(props) {
    super(props);

    const questionResponses = {};
    // initial values
    props.contact.questionResponseValues.forEach(questionResponse => {
      questionResponses[questionResponse.interactionStepId] =
        questionResponse.value;
    });
    const availableSteps = getAvailableInteractionSteps(
      questionResponses,
      props.campaign.interactionSteps
    );
    this.state = {
      questionResponses,
      optOutMessageText: props.campaign.organization.optOutMessage,
      responsePopoverOpen: false,
      answerPopoverOpen: false,
      messageText: this.getStartingMessageText(),
      cannedResponseScript: null,
      optOutDialogOpen: false,
      currentShortcutSpace: 0,
      messageFocus: false,
      availableSteps: availableSteps,
      currentInteractionStep:
        availableSteps.length > 0
          ? availableSteps[availableSteps.length - 1]
          : null
    };
  }

  componentDidMount() {
    const node = this.refs.messageScrollContainer;
    // Does not work without this setTimeout
    setTimeout(() => {
      node.scrollTop = Math.floor(node.scrollHeight);
    }, 0);

    // note: key*down* is necessary to stop propagation of keyup for the textarea element
    document.body.addEventListener("keydown", this.onEnter);
    window.addEventListener("resize", this.onResize);
  }

  componentWillUnmount() {
    document.body.removeEventListener("keydown", this.onEnter);
    window.removeEventListener("resize", this.onResize);
  }

  getStartingMessageText() {
    const { campaign, messageStatusFilter } = this.props;
    return messageStatusFilter === "needsMessage"
      ? this.props.getMessageTextFromScript(
          getTopMostParent(campaign.interactionSteps).script
        )
      : "";
  }

  onResize = evt => {
    // trigger re-render to determine whether there's space for shortcuts
    this.setState({
      currentShortcutSpace: this.refs.answerButtons.offsetHeight
    });
  };

  onEnter = evt => {
    // FUTURE: consider disabling except in needsMessage
    if (evt.keyCode === 13) {
      evt.preventDefault();
      // pressing the Enter key submits
      if (this.state.optOutDialogOpen) {
        const { optOutMessageText } = this.state;
        this.props.onOptOut({ optOutMessageText });
      } else {
        this.handleClickSendMessageButton();
      }
    }
  };

  optOutSchema = yup.object({
    optOutMessageText: yup.string()
  });

  messageSchema = yup.object({
    messageText: yup
      .string()
      .required("Can't send empty message")
      .max(window.MAX_MESSAGE_LENGTH)
  });

  handleClickSendMessageButton = () => {
    this.refs.form.submit();
  };

  handleCannedResponseChange = cannedResponseScript => {
    const currentCannedResponseId =
      this.state.cannedResponseScript && this.state.cannedResponseScript.id;

    if (cannedResponseScript.id === currentCannedResponseId) {
      // identical means we're cancelling it -- so it can be toggled
      this.setState({
        messageText: "",
        cannedResponseScript: null
      });
    } else {
      this.handleChangeScript(cannedResponseScript.text);
      this.setState({
        cannedResponseScript,
        answerPopoverOpen: false
      });
    }
  };

  handleOpenDialog = () => {
    this.setState({
      optOutDialogOpen: true,
      // store this, because on-close, we lose this
      currentShortcutSpace: this.refs.answerButtons.offsetHeight
    });
  };

  handleCloseDialog = () => {
    this.setState({ optOutDialogOpen: false });
  };

  handleQuestionResponseChange = ({
    interactionStep,
    questionResponseValue,
    nextScript
  }) => {
    const { questionResponses } = this.state;
    const { interactionSteps } = this.props.campaign;
    questionResponses[interactionStep.id] = questionResponseValue;

    const children = getChildren(interactionStep, interactionSteps);
    for (const childStep of children) {
      if (childStep.id in questionResponses) {
        questionResponses[childStep.id] = null;
      }
    }

    const availableSteps = getAvailableInteractionSteps(
      questionResponses,
      interactionSteps
    );
    // TODO sky: ? do we sometimes need to update state.currentInteractionStep?
    // it doesn't seem to be able to change if we clear a response
    this.setState(
      {
        questionResponses,
        availableSteps
      },
      () => {
        this.handleChangeScript(nextScript);
        // a bit odd, but we need to update the parent context's state as well
        // this is because responses are sent to the server on many other actions
        // so any of those can trigger a question response update
        this.props.onQuestionResponseChange({ questionResponses });
      }
    );
  };

  handleChangeScript = newScript => {
    const messageText = this.props.getMessageTextFromScript(newScript) || "";

    this.setState({
      messageText,
      cannedResponseScript: null
    });
  };

  handleMessageFormChange = ({ messageText }) => this.setState({ messageText });

  handleOpenAnswerPopover = event => {
    event.preventDefault();
    this.setState({
      answerPopoverAnchorEl: event.currentTarget,
      answerPopoverOpen: true
    });
  };

  handleCloseAnswerPopover = () => {
    this.setState({
      answerPopoverOpen: false
    });
  };

  handleOpenResponsePopover = event => {
    event.preventDefault();
    this.setState({
      responsePopoverAnchorEl: event.currentTarget,
      responsePopoverOpen: true
    });
  };

  handleCloseResponsePopover = () => {
    this.setState({
      responsePopoverOpen: false
    });
  };

  renderSurveySection() {
    const { assignment, campaign, contact } = this.props;
    const {
      answerPopoverOpen,
      questionResponses,
      cannedResponseScript
    } = this.state;
    const { messages } = contact;

    const availableInteractionSteps = getAvailableInteractionSteps(
      questionResponses,
      campaign.interactionSteps
    );

    const otherResponsesLink =
      this.state.currentInteractionStep &&
      this.state.currentInteractionStep.question.answerOptions.length > 6 &&
      assignment.campaignCannedResponses.length ? (
        <div className={css(flexStyles.popoverLink)}>
          <a
            href="#otherresponses"
            className={css(flexStyles.popoverLinkColor)}
          >
            Other Responses
          </a>
        </div>
      ) : null;

    return (
      <Popover
        style={inlineStyles.popover}
        className={css(flexStyles.popover)}
        open={answerPopoverOpen}
        anchorEl={this.state.answerPopoverAnchorEl}
        anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
        targetOrigin={{ horizontal: "left", vertical: "bottom" }}
        onRequestClose={this.handleCloseAnswerPopover}
      >
        <AssignmentTexterSurveys
          contact={contact}
          interactionSteps={availableInteractionSteps}
          onQuestionResponseChange={this.handleQuestionResponseChange}
          currentInteractionStep={this.state.currentInteractionStep}
          listHeader={otherResponsesLink}
          questionResponses={questionResponses}
          onRequestClose={this.handleCloseAnswerPopover}
        />
        <ScriptList
          scripts={assignment.campaignCannedResponses}
          showAddScriptButton={false}
          customFields={campaign.customFields}
          currentCannedResponseScript={cannedResponseScript}
          subheader={<div id="otherresponses">Other Responses</div>}
          onSelectCannedResponse={this.handleCannedResponseChange}
          onCreateCannedResponse={this.props.onCreateCannedResponse}
        />
        <ScriptList
          scripts={assignment.userCannedResponses}
          showAddScriptButton={true}
          customFields={[] /* texters shouldn't have access to custom fields */}
          currentCannedResponseScript={cannedResponseScript}
          subheader={<span>Personal Custom Responses</span>}
          onSelectCannedResponse={this.handleCannedResponseChange}
          onCreateCannedResponse={this.props.onCreateCannedResponse}
        />
      </Popover>
    );
  }

  renderNeedsResponseToggleButton(contact) {
    const { messageStatus } = contact;
    let button = null;
    if (messageStatus === "needsMessage") {
      return null;
    } else if (messageStatus === "closed") {
      // todo: add flex: style.
      button = (
        <FlatButton
          onTouchTap={() => this.props.onEditStatus("needsResponse")}
          label="Reopen"
          className={css(flexStyles.flatButton)}
          style={{ flex: "1 1 auto" }}
          labelStyle={inlineStyles.flatButtonLabel}
          backgroundColor="white"
        />
      );
    } else {
      button = (
        <FlatButton
          onTouchTap={() => this.props.onEditStatus("closed", true)}
          label="Skip"
          className={css(flexStyles.flatButton)}
          style={{
            /*WTF: TODO resolve with reopen and labelStyle */
            flex: "1 2 auto"
          }}
          labelStyle={{ ...inlineStyles.flatButtonLabel, flex: "1 1 auto" }}
          backgroundColor="white"
        />
      );
    }

    return button;
  }

  renderOptOutDialog() {
    if (!this.state.optOutDialogOpen) {
      return "";
    }
    return (
      <Card className={css(flexStyles.sectionOptOutDialog)}>
        <CardTitle title="Opt out user" />
        <CardActions className={css(flexStyles.sectionOptOutDialog)}>
          <GSForm
            className={css(flexStyles.sectionOptOutDialog)}
            schema={this.optOutSchema}
            onChange={({ optOutMessageText }) =>
              this.setState({ optOutMessageText })
            }
            value={{ optOutMessageText: this.state.optOutMessageText }}
            onSubmit={this.props.onOptOut}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "left"
              }}
            >
              <FlatButton
                className={css(flexStyles.flatButton)}
                labelStyle={inlineStyles.flatButtonLabel}
                style={{
                  margin: "9px",
                  color:
                    this.state.optOutMessageText ===
                    this.props.campaign.organization.optOutMessage
                      ? "white"
                      : "#494949",
                  backgroundColor:
                    this.state.optOutMessageText ===
                    this.props.campaign.organization.optOutMessage
                      ? "#727272"
                      : "white"
                }}
                label="Standard Message"
                onTouchTap={() => {
                  this.setState({
                    optOutMessageText: this.props.campaign.organization
                      .optOutMessage
                  });
                }}
              />
              <FlatButton
                className={css(flexStyles.flatButton)}
                labelStyle={inlineStyles.flatButtonLabel}
                style={{
                  margin: "0 9px 0 9px",
                  color:
                    this.state.optOutMessageText === "" ? "white" : "#494949",
                  backgroundColor:
                    this.state.optOutMessageText === "" ? "#727272" : "white"
                }}
                label="No Message"
                onTouchTap={() => {
                  this.setState({ optOutMessageText: "" });
                }}
              />
            </div>
            <Form.Field
              name="optOutMessageText"
              fullWidth
              autoFocus
              multiLine
            />
            <div className={css(flexStyles.subSectionOptOutDialogActions)}>
              <FlatButton
                className={css(flexStyles.flatButton)}
                labelStyle={inlineStyles.flatButtonLabel}
                style={inlineStyles.inlineBlock}
                label="Cancel"
                onTouchTap={this.handleCloseDialog}
              />
              <FlatButton
                type="submit"
                className={css(flexStyles.flatButton)}
                labelStyle={inlineStyles.flatButtonLabel}
                style={{
                  ...inlineStyles.inlineBlock,
                  borderColor: "#790000",
                  color: "white",
                  marginLeft: "9px"
                }}
                backgroundColor="#BC0000"
                label={<span>&crarr; Opt-Out</span>}
              />
            </div>
          </GSForm>
        </CardActions>
      </Card>
    );
  }

  renderMessagingRowMessage({ readOnly = false }) {
    return (
      <div className={css(flexStyles.sectionMessageField)}>
        <GSForm
          ref="form"
          schema={this.messageSchema}
          value={{ messageText: this.state.messageText }}
          onSubmit={this.props.onMessageFormSubmit}
          onChange={
            readOnly
              ? null // message is uneditable for firstMessage
              : this.handleMessageFormChange
          }
        >
          <Form.Field
            className={css(flexStyles.subSectionMessageFieldTextField)}
            name="messageText"
            label="Your message"
            onFocus={() => {
              this.setState({ messageFocus: true });
            }}
            onBlur={() => {
              this.setState({ messageFocus: false });
            }}
            multiLine
            fullWidth
            rowsMax={6}
          />
        </GSForm>
      </div>
    );
  }

  renderMessagingRowCurrentQuestion(currentQuestion, currentQuestionAnswered) {
    return (
      <div
        className={css(flexStyles.subSubButtonsAnswerButtonsCurrentQuestion)}
      >
        {currentQuestionAnswered ? (
          <span>
            {currentQuestion.text}: <b>{currentQuestionAnswered}</b>
          </span>
        ) : (
          <span>
            <span className={css(flexStyles.flatButtonLabelMobile)}>
              What was their reply to:{" "}
            </span>
            <b>{currentQuestion.text}</b>
          </span>
        )}
      </div>
    );
  }

  renderMessagingRowReplyShortcuts() {
    const { assignment } = this.props;
    const {
      availableSteps,
      questionResponses,
      currentInteractionStep,
      cannedResponseScript
    } = this.state;

    let joinedLength = 0;
    let currentQuestion = null;
    let currentQuestionAnswered = null;
    let currentQuestionOptions = [];
    // 1. Current Interaction Step Shortcuts
    if (currentInteractionStep) {
      currentQuestion = currentInteractionStep.question;
      currentQuestionAnswered = questionResponses[currentInteractionStep.id];
      currentQuestionOptions = currentQuestion.answerOptions.map(answer => {
        // label is for one-word values or e.g. "Yes: ...."
        const label = answer.value.match(/^(\w+)([^\s\w]|$)/);
        return {
          answer: answer,
          label: label ? label[1] : answer.value
        };
      });
      joinedLength = currentQuestionOptions.map(o => o.label).join("__").length;
      if (joinedLength > 30) {
        // too many/long options
        currentQuestionOptions = [];
        joinedLength = 0;
      }
    }
    // 2. Canned Response Shortcuts
    let shortCannedResponses = [];
    // If there's a current interaction step but we aren't showing choices
    // then don't show canned response shortcuts either or it can
    // cause confusion.
    if (!currentInteractionStep || joinedLength !== 0) {
      shortCannedResponses = assignment.campaignCannedResponses
        .filter(
          // allow for "Wrong Number"
          script =>
            (script.title.length < 13 || script.title[0] === ":") &&
            script.title[script.title.length - 1] !== "."
        )
        .filter(script => {
          if (joinedLength + 1 + script.title.length < 80) {
            joinedLength += 1 + script.title.length;
            return true;
          }
        });
    }

    if (!joinedLength) {
      return null;
    }
    const isCurrentAnswer = opt =>
      opt.answer.value === questionResponses[currentInteractionStep.id];
    const isCurrentCannedResponse = script =>
      cannedResponseScript && script.id === cannedResponseScript.id;
    return (
      <div>
        {currentQuestionOptions.map(opt => (
          <FlatButton
            key={`shortcutStep_${opt.answer.value}`}
            label={opt.label}
            onTouchTap={evt => {
              this.handleQuestionResponseChange({
                interactionStep: currentInteractionStep,
                questionResponseValue: isCurrentAnswer(opt)
                  ? null
                  : opt.answer.value,
                nextScript:
                  (!isCurrentAnswer(opt) &&
                    opt.answer.nextInteractionStep &&
                    opt.answer.nextInteractionStep.script) ||
                  null
              });
            }}
            className={css(flexStyles.flatButton)}
            style={{ marginRight: "9px" }}
            labelStyle={{
              ...inlineStyles.flatButtonLabel,
              color: isCurrentAnswer(opt) ? "white" : "#494949"
            }}
            backgroundColor={isCurrentAnswer(opt) ? "#727272" : "white"}
          />
        ))}
        {shortCannedResponses.map(script => (
          <FlatButton
            key={`shortcutScript_${script.id}`}
            label={script.title.replace(/^:/, "")}
            onTouchTap={evt => {
              this.handleCannedResponseChange(script);
            }}
            className={css(flexStyles.flatButton)}
            style={{ marginLeft: "9px" }}
            labelStyle={{
              ...inlineStyles.flatButtonLabel,
              color: isCurrentCannedResponse(script) ? "white" : "#494949"
            }}
            backgroundColor={
              isCurrentCannedResponse(script) ? "#727272" : "white"
            }
          />
        ))}
      </div>
    );
  }

  renderMessagingRowReplyButtons(availableSteps) {
    return (
      <div className={css(flexStyles.subButtonsExitButtons)}>
        <FlatButton
          label={
            <span>
              All Responses <DownIcon style={{ verticalAlign: "middle" }} />
            </span>
          }
          onTouchTap={this.handleOpenAnswerPopover}
          className={css(flexStyles.flatButton)}
          labelStyle={inlineStyles.flatButtonLabel}
          backgroundColor={
            availableSteps.length ? "white" : "rgb(176, 176, 176)"
          }
          disabled={!availableSteps.length}
        />

        <FlatButton
          {...dataTest("optOut")}
          label="Opt-out"
          onTouchTap={this.handleOpenDialog}
          className={css(flexStyles.flatButton)}
          labelStyle={{ ...inlineStyles.flatButtonLabel, color: "#DE1A1A" }}
          backgroundColor="white"
        />
      </div>
    );
  }

  renderMessagingRowSendSkip(contact) {
    return (
      <div className={css(flexStyles.sectionSend)}>
        <FlatButton
          {...dataTest("send")}
          onTouchTap={this.handleClickSendMessageButton}
          disabled={this.props.disabled}
          label={<span>&crarr; Send</span>}
          className={`${css(flexStyles.flatButton)} ${css(
            flexStyles.subSectionSendButton
          )}`}
          labelStyle={inlineStyles.flatButtonLabel}
          backgroundColor={theme.colors.coreBackgroundColor}
          hoverColor={theme.colors.coreHoverColor}
          primary
        />
        {this.renderNeedsResponseToggleButton(contact)}
      </div>
    );
  }

  renderMessageControls() {
    const { contact, messageStatusFilter } = this.props;
    const {
      availableSteps,
      questionResponses,
      currentInteractionStep
    } = this.state;

    if (this.state.optOutDialogOpen) {
      return this.renderOptOutDialog();
    }

    let currentQuestion = null;
    let currentQuestionAnswered = null;
    if (currentInteractionStep) {
      currentQuestion = currentInteractionStep.question;
      currentQuestionAnswered = questionResponses[currentInteractionStep.id];
    }
    return [
      this.renderMessagingRowMessage({}),
      <div key="sectionButtons" className={css(flexStyles.sectionButtons)}>
        <div
          className={css(flexStyles.subButtonsAnswerButtons)}
          ref="answerButtons"
        >
          {currentQuestion
            ? this.renderMessagingRowCurrentQuestion(
                currentQuestion,
                currentQuestionAnswered
              )
            : null}
          <div className={css(flexStyles.subSubAnswerButtonsColumns)}>
            {this.renderMessagingRowReplyShortcuts()}
          </div>
        </div>

        {this.renderMessagingRowReplyButtons(availableSteps)}
      </div>,
      this.renderMessagingRowSendSkip(contact),
      this.renderSurveySection()
    ];
  }

  renderToolbar() {
    return (
      <div key="toolbar" className={css(flexStyles.sectionHeaderToolbar)}>
        <ContactToolbarNew
          campaign={this.props.campaign}
          campaignContact={this.props.contact}
          navigationToolbarChildren={this.props.navigationToolbarChildren}
          onExit={this.props.onExitTexter}
        />
      </div>
    );
  }

  renderFirstMessage() {
    return [
      this.renderToolbar(),
      <div
        {...dataTest("messageList")}
        ref="messageScrollContainer"
        key="messageScrollContainer"
        className={css(flexStyles.sectionMessageThread)}
      >
        <Empty
          title={
            "This is your first message to " + this.props.contact.firstName
          }
          icon={<CreateIcon color="rgb(83, 180, 119)" />}
        />
      </div>,
      this.renderMessagingRowMessage({ readOnly: true }),
      this.renderMessagingRowSendSkip(this.props.contact)
    ];
  }

  render() {
    const firstMessage = this.props.messageStatusFilter === "needsMessage";
    const content = firstMessage
      ? this.renderFirstMessage()
      : [
          this.renderToolbar(),
          <div
            {...dataTest("messageList")}
            key="messageScrollContainer"
            ref="messageScrollContainer"
            className={css(flexStyles.sectionMessageThread)}
          >
            <MessageList
              contact={this.props.contact}
              messages={this.props.contact.messages}
              styles={messageListStyles}
            />
          </div>,
          this.renderMessageControls()
        ];
    return <div className={css(flexStyles.topContainer)}>{content}</div>;
  }
}

AssignmentTexterContactControls.propTypes = {
  // data
  contact: PropTypes.object,
  campaign: PropTypes.object,
  assignment: PropTypes.object,
  texter: PropTypes.object,

  // parent state
  disabled: PropTypes.bool,
  navigationToolbarChildren: PropTypes.object,
  messageStatusFilter: PropTypes.string,

  // parent config/callbacks
  startingMessage: PropTypes.string,
  onMessageFormSubmit: PropTypes.func,
  onOptOut: PropTypes.func,
  onQuestionResponseChange: PropTypes.func,
  onCreateCannedResponse: PropTypes.func,
  onExitTexter: PropTypes.func,
  onEditStatus: PropTypes.func,
  getMessageTextFromScript: PropTypes.func
};

export default AssignmentTexterContactControls;
