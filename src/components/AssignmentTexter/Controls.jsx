import PropTypes from "prop-types";
import React from "react";
import { StyleSheet, css } from "aphrodite";
import Toolbar from "./Toolbar";
import MessageList from "./MessageList";
import CannedResponseMenu from "./CannedResponseMenu";
import Survey from "./Survey";
import ScriptList from "./ScriptList";
import Empty from "../Empty";
import GSForm from "../forms/GSForm";
import RaisedButton from "material-ui/RaisedButton";
import FlatButton from "material-ui/FlatButton";
import IconButton from "material-ui/IconButton/IconButton";
import { Card, CardActions, CardTitle } from "material-ui/Card";
import Divider from "material-ui/Divider";
import CreateIcon from "material-ui/svg-icons/content/create";
import DownIcon from "material-ui/svg-icons/navigation/arrow-drop-down";
import yup from "yup";
import theme from "../../styles/theme";
import Form from "react-formal";
import Popover from "material-ui/Popover";
import { messageListStyles, inlineStyles, flexStyles } from "./StyleControls";

import { renderSidebox } from "../../extensions/texter-sideboxes/components";

import {
  getChildren,
  getAvailableInteractionSteps,
  getTopMostParent,
  interactionStepForId,
  log,
  isBetweenTextingHours
} from "../../lib";

import { dataTest } from "../../lib/attributes";

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
      sideboxCloses: {},
      sideboxOpens: {},
      messageText: this.getStartingMessageText(),
      cannedResponseScript: null,
      optOutDialogOpen: false,
      currentShortcutSpace: 0,
      messageFocus: false,
      availableSteps,
      messageReadOnly: false,
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
    document.body.addEventListener("keyup", this.onKeyUp);
    document.body.addEventListener("keypress", this.blockWithCtrl);
    window.addEventListener("resize", this.onResize);
    window.addEventListener("orientationchange", this.onResize);
  }

  componentWillUnmount() {
    document.body.removeEventListener("keyup", this.onKeyUp);
    document.body.removeEventListener("keypress", this.blockWithCtrl);
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("orientationchange", this.onResize);
  }

  componentWillUpdate(nextProps, nextState) {
    // we refresh sideboxes here because we need to compare previous state
    const newPopups = [];
    nextProps.enabledSideboxes &&
      nextProps.enabledSideboxes.popups.forEach((sb, i) => {
        if (this.props.enabledSideboxes.popups.indexOf(sb) === -1) {
          newPopups.push(sb);
        }
      });
    // For getDerivedStateFromProps in React 16:
    // newPopups increment open
    newPopups.forEach(sb => {
      nextState.sideboxOpens[sb] = (nextState.sideboxOpens[sb] || 0) + 1;
    });
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
    if (this.refs.answerButtons) {
      this.setState({
        currentShortcutSpace: this.refs.answerButtons.offsetHeight
      });
    }
  };

  blockWithCtrl = evt => {
    // HACK: This blocks Ctrl-Enter from triggering 'click'
    // after a shortcut key has been pressed (instead of doing a send)
    if (evt.ctrlKey && evt.key === "Enter") {
      evt.preventDefault();
    }
  };

  onKeyUp = evt => {
    if (
      window.document &&
      document.location &&
      /keys=1/.test(document.location.search)
    ) {
      // for debugging when keys don't work
      document.location = `#${evt.key}`;
      console.log(
        "keypress",
        evt.key,
        evt.ctrlKey,
        evt.keyCode,
        this.state.messageReadOnly,
        this.props.messageStatusFilter
      );
    }

    if (evt.key === "Escape") {
      this.setState({
        optOutDialogOpen: false,
        responsePopoverOpen: false,
        answerPopoverOpen: false
      });
    }
    // if document.activeElement then ignore a naked keypress to be safe
    // console.log('KEYBOARD', evt.key, document.activeElement);
    if (
      // SEND: Ctrl-Enter/Ctrl-z
      evt.key === "Enter" &&
      // need to use ctrlKey in non-first texting context for accessibility
      evt.ctrlKey
    ) {
      evt.preventDefault();
      if (this.state.optOutDialogOpen) {
        const { optOutMessageText } = this.state;
        this.props.onOptOut({ optOutMessageText });
      } else {
        this.handleClickSendMessageButton(true);
      }
      return;
    }

    if (
      // SKIP: Ctrl-y
      evt.key === "y" &&
      // need to use ctrlKey in non-first texting context for accessibility
      evt.ctrlKey
    ) {
      evt.preventDefault();
      this.props.onEditStatus("closed", true);
    }
    // Allow initial sends to use any key, avoiding RSI injuries
    // the texter can distribute which button to press across the keyboard
    if (
      this.props.messageStatusFilter === "needsMessage" &&
      this.state.messageReadOnly &&
      !evt.ctrlKey &&
      !evt.metaKey &&
      !evt.altKey &&
      (/[a-z,./;']/.test(evt.key) ||
        evt.key === "Enter" ||
        evt.key === "Return" ||
        evt.key === "Space" ||
        evt.key === " " ||
        evt.key === "Semicolon")
    ) {
      evt.preventDefault();
      this.handleClickSendMessageButton();
      return;
    }
  };

  optOutSchema = yup.object({
    optOutMessageText: yup.string()
  });

  messageSchema = yup.object({
    messageText: yup
      .string()
      .trim()
      .required("Can't send empty message")
      .max(window.MAX_MESSAGE_LENGTH)
  });

  handleClickSendMessageButton = doneClicked => {
    if (
      doneClicked !== true &&
      window.TEXTER_TWOCLICK &&
      !this.state.doneFirstClick
    ) {
      this.setState({ doneFirstClick: true });
    } else {
      this.refs.form.submit();
      this.setState({ doneFirstClick: false });
    }
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
    // delay to avoid accidental tap pass-through with focusing on
    // the text field -- this is annoying on mobile where the keyboard
    // pops up, inadvertantly
    const update = { optOutDialogOpen: true };
    if (this.refs.answerButtons) {
      // store this, because on-close, we lose this
      update.currentShortcutSpace = this.refs.answerButtons.offsetHeight;
    }
    const self = this;
    setTimeout(() => self.setState(update), 200);
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
    // delay to avoid accidental tap pass-through with focusing on
    // the text field -- this is annoying on mobile where the keyboard
    // pops up, inadvertantly
    const self = this;
    setTimeout(
      () =>
        self.setState({
          responsePopoverOpen: false
        }),
      200
    );
  };

  closeSideboxDialog = () => {
    const { enabledSideboxes } = this.props;
    // Close the dialog
    const sideboxCloses = { ...this.state.sideboxCloses };
    // since we are closing, we need all opens to be reflected in sideboxCloses
    enabledSideboxes.popups.forEach(popup => {
      sideboxCloses[popup] = this.state.sideboxOpens[popup] || 0;
    });
    sideboxCloses.MANUAL = this.state.sideboxOpens.MANUAL || 0;
    this.setState({ sideboxCloses });
  };

  handleClickSideboxDialog = () => {
    const { enabledSideboxes } = this.props;
    console.log("handleClickSideboxDialog", enabledSideboxes);
    const sideboxOpen = this.getSideboxDialogOpen(enabledSideboxes);
    if (sideboxOpen) {
      this.closeSideboxDialog();
    } else {
      // Open the dialog
      const sideboxOpens = { ...this.state.sideboxOpens };
      sideboxOpens.MANUAL = (this.state.sideboxCloses.MANUAL || 0) + 1;
      this.setState({ sideboxOpens });
    }
  };

  getSideboxDialogOpen = enabledSideboxes => {
    // needs to be mobile-small + not dismissed
    const { sideboxCloses, sideboxOpens } = this.state;
    const documentWidth = document.documentElement.clientWidth;
    if (documentWidth > 575) {
      // also in Toolbar.jsx::navigationSidebox
      return false;
    }
    if (sideboxOpens.MANUAL > (sideboxCloses.MANUAL || 0)) {
      return true;
    }
    return enabledSideboxes.popups.some(
      popup => (sideboxOpens[popup] || 0) > (sideboxCloses[popup] || 0)
    );
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
      campaign.cannedResponses.length ? (
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
        <Survey
          contact={contact}
          interactionSteps={availableInteractionSteps}
          onQuestionResponseChange={this.handleQuestionResponseChange}
          currentInteractionStep={this.state.currentInteractionStep}
          listHeader={otherResponsesLink}
          questionResponses={questionResponses}
          onRequestClose={this.handleCloseAnswerPopover}
        />
        <ScriptList
          scripts={campaign.cannedResponses}
          showAddScriptButton={false}
          customFields={campaign.customFields}
          currentCannedResponseScript={cannedResponseScript}
          subheader={<div id="otherresponses">Other Responses</div>}
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
          onClick={() => this.props.onEditStatus("needsResponse")}
          label="Reopen"
          className={css(flexStyles.flatButton)}
          style={{ flex: "1 1 auto" }}
          labelStyle={inlineStyles.flatButtonLabel}
          backgroundColor="white"
          disabled={!!this.props.contact.optOut}
        />
      );
    } else {
      button = (
        <FlatButton
          onClick={() => this.props.onEditStatus("closed", true)}
          label="Skip"
          className={css(flexStyles.flatButton)}
          style={{
            /* WTF: TODO resolve with reopen and labelStyle */
            flex: "1 2 auto"
          }}
          labelStyle={{ ...inlineStyles.flatButtonLabel, flex: "1 1 auto" }}
          backgroundColor="white"
          disabled={!!this.props.contact.optOut}
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
                onClick={() => {
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
                onClick={() => {
                  this.setState({ optOutMessageText: "" });
                }}
              />
            </div>
            <Form.Field name="optOutMessageText" fullWidth multiLine />
            <div className={css(flexStyles.subSectionOptOutDialogActions)}>
              <FlatButton
                className={css(flexStyles.flatButton)}
                labelStyle={inlineStyles.flatButtonLabel}
                style={inlineStyles.inlineBlock}
                label="Cancel"
                onClick={this.handleCloseDialog}
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

  renderMessagingRowMessage(enabledSideboxes) {
    const { cannedResponseScript } = this.state;
    const isFeedbackEnabled =
      !!enabledSideboxes &&
      !!enabledSideboxes.find(sidebox => sidebox.name === "texter-feedback");
    return (
      <div
        className={css(flexStyles.sectionMessageField)}
        style={isFeedbackEnabled ? { width: "calc(100% - 390px)" } : undefined}
      >
        <GSForm
          ref="form"
          schema={this.messageSchema}
          value={{ messageText: this.state.messageText }}
          onSubmit={this.props.onMessageFormSubmit(
            cannedResponseScript && cannedResponseScript.id
          )}
          onChange={
            this.state.messageReadOnly
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
    if (!currentQuestion || !currentQuestion.text) {
      return null;
    }
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
            <span className={css(flexStyles.flatButtonLabelMobile)}>Q: </span>
            <b>{currentQuestion.text}</b>
          </span>
        )}
      </div>
    );
  }

  renderMessagingRowReplyShortcuts() {
    const { assignment, campaign } = this.props;
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
    const currentStepHasAnswerOptions =
      currentInteractionStep &&
      currentInteractionStep.question &&
      currentInteractionStep.question.answerOptions &&
      currentInteractionStep.question.answerOptions.length;
    if (currentStepHasAnswerOptions) {
      currentQuestion = currentInteractionStep.question;
      currentQuestionAnswered = questionResponses[currentInteractionStep.id];
      const dupeTester = {};
      const shortener = answerValue => {
        // label is for one-word values or e.g. "Yes: ...."
        const label = answerValue.match(/^(\w+)([^\s\w]|$)/);
        return label ? label[1] : answerValue;
      };
      currentQuestionOptions = currentQuestion.answerOptions
        .filter(answer => answer.value[0] != "-")
        .map(answer => {
          let label = shortener(answer.value);
          if (label in dupeTester) {
            dupeTester.FAIL = true;
          } else {
            dupeTester[label] = 1;
          }
          return {
            answer,
            label
          };
        });
      joinedLength = currentQuestionOptions.map(o => o.label).join("__").length;
      if (joinedLength > 36 || dupeTester.FAIL) {
        // too many/long options or duplicates
        currentQuestionOptions = [];
        joinedLength = 0;
      }
    }
    // 2. Canned Response Shortcuts
    let shortCannedResponses = [];
    // If there's a current interaction step but we aren't showing choices
    // then don't show canned response shortcuts either or it can
    // cause confusion.
    if (!currentStepHasAnswerOptions || joinedLength !== 0) {
      shortCannedResponses = campaign.cannedResponses
        .filter(
          // allow for "Wrong Number", prefixes of + or - can force add or remove
          script =>
            (script.title.length < 13 || script.title[0] === "+") &&
            script.title[0] !== "-"
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
    // the only non-contextual state/props needed
    // questionResponses, currentInteractionStep, cannedResponseScript
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
            onClick={evt => {
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
            label={script.title.replace(/^(\+|\-)/, "")}
            onClick={evt => {
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

  renderMessagingRowReplyButtons(availableSteps, cannedResponses) {
    const disabled =
      !cannedResponses.length &&
      availableSteps.length === 1 &&
      (!availableSteps[0].question ||
        !availableSteps[0].question.answerOptions ||
        !availableSteps[0].question.answerOptions.length);
    return (
      <div className={css(flexStyles.subButtonsExitButtons)}>
        <FlatButton
          label={
            <span>
              All Responses <DownIcon style={{ verticalAlign: "middle" }} />
            </span>
          }
          role="button"
          onClick={!disabled ? this.handleOpenAnswerPopover : noAction => {}}
          className={css(flexStyles.flatButton)}
          labelStyle={inlineStyles.flatButtonLabel}
          backgroundColor={
            availableSteps.length ? "white" : "rgb(176, 176, 176)"
          }
          disabled={disabled}
        />

        <FlatButton
          {...dataTest("optOut")}
          label="Opt-out"
          onClick={this.handleOpenDialog}
          className={css(flexStyles.flatButton)}
          labelStyle={{ ...inlineStyles.flatButtonLabel, color: "#DE1A1A" }}
          backgroundColor="white"
          disabled={!!this.props.contact.optOut}
        />
      </div>
    );
  }

  renderMessagingRowSendSkip(contact) {
    const firstMessage = this.props.messageStatusFilter === "needsMessage";
    return (
      <div
        className={css(flexStyles.sectionSend)}
        style={firstMessage ? { height: "54px" } : { height: "36px" }}
      >
        <FlatButton
          {...dataTest("send")}
          onClick={this.handleClickSendMessageButton}
          disabled={this.props.disabled || !!this.props.contact.optOut}
          label={<span>&crarr; Send</span>}
          className={`${css(flexStyles.flatButton)} ${css(
            flexStyles.subSectionSendButton
          )}`}
          labelStyle={inlineStyles.flatButtonLabel}
          backgroundColor={
            this.props.disabled
              ? theme.colors.coreBackgroundColorDisabled
              : this.state.doneFirstClick
              ? theme.colors.darkBlue
              : theme.colors.coreBackgroundColor
          }
          hoverColor={
            this.state.doneFirstClick
              ? theme.colors.lightBlue
              : theme.colors.coreHoverColor
          }
          primary
        />
        {this.renderNeedsResponseToggleButton(contact)}
      </div>
    );
  }

  renderMessageControls(enabledSideboxes) {
    const { contact, messageStatusFilter, assignment, campaign } = this.props;
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
      this.renderMessagingRowMessage(enabledSideboxes),
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

        {this.renderMessagingRowReplyButtons(
          availableSteps,
          campaign.cannedResponses
        )}
      </div>,
      this.renderMessagingRowSendSkip(contact),
      this.renderSurveySection()
    ];
  }

  renderToolbar(enabledSideboxes) {
    return (
      <div key="toolbar" className={css(flexStyles.sectionHeaderToolbar)}>
        <Toolbar
          campaign={this.props.campaign}
          campaignContact={this.props.contact}
          navigationToolbarChildren={this.props.navigationToolbarChildren}
          onExit={this.props.onExitTexter}
          onSideboxButtonClick={
            enabledSideboxes && enabledSideboxes.length > 0
              ? this.handleClickSideboxDialog
              : null
          }
        />
      </div>
    );
  }

  renderSidebox(enabledSideboxes) {
    if (!enabledSideboxes || !enabledSideboxes.length) {
      return null;
    }
    const settingsData = JSON.parse(
      this.props.campaign.texterUIConfig.options || "{}"
    );
    const sideboxList = enabledSideboxes.map(sidebox => {
      return renderSidebox(sidebox, settingsData, this);
    });
    const sideboxOpen = this.getSideboxDialogOpen(enabledSideboxes);
    if (sideboxOpen) {
      return (
        <Popover
          style={inlineStyles.popoverSidebox}
          className={css(flexStyles.popover)}
          open={sideboxOpen}
          anchorEl={this.refs.messageBox}
          anchorOrigin={{ horizontal: "middle", vertical: "top" }}
          targetOrigin={{ horizontal: "middle", vertical: "top" }}
          onRequestClose={this.handleClickSideboxDialog}
        >
          {sideboxList}
        </Popover>
      );
    }
    // TODO: max height and scroll-y
    return <div className={css(flexStyles.sectionSideBox)}>{sideboxList}</div>;
  }

  renderMessageBox(internalComponent, enabledSideboxes) {
    const isFeedbackEnabled =
      !!enabledSideboxes &&
      !!enabledSideboxes.find(sidebox => sidebox.name === "texter-feedback");
    return (
      <div
        ref="messageBox"
        className={css(flexStyles.superSectionMessageBox)}
        style={isFeedbackEnabled ? { width: "calc(100% - 382px)" } : undefined}
      >
        <div
          {...dataTest("messageList")}
          key="messageScrollContainer"
          ref="messageScrollContainer"
          className={css(flexStyles.sectionMessageThread)}
        >
          {internalComponent}
        </div>
        {this.renderSidebox(enabledSideboxes)}
      </div>
    );
  }

  renderFirstMessage(enabledSideboxes) {
    return [
      this.renderToolbar(enabledSideboxes),
      this.renderMessageBox(
        <Empty
          title={
            "This is your first message to " + this.props.contact.firstName
          }
          icon={<CreateIcon color="rgb(83, 180, 119)" />}
        />,
        enabledSideboxes
      ),
      this.renderMessagingRowMessage(),
      this.renderMessagingRowSendSkip(this.props.contact)
    ];
  }

  render() {
    const { enabledSideboxes } = this.props;
    const firstMessage = this.props.messageStatusFilter === "needsMessage";
    const content = firstMessage
      ? this.renderFirstMessage(enabledSideboxes)
      : [
          this.renderToolbar(enabledSideboxes),
          this.renderMessageBox(
            <MessageList
              contact={this.props.contact}
              currentUser={this.props.currentUser}
              messages={this.props.contact.messages}
              organizationId={this.props.organizationId}
              review={this.props.review}
              styles={messageListStyles}
            />,
            enabledSideboxes
          ),
          this.renderMessageControls(enabledSideboxes)
        ];
    return <div className={css(flexStyles.topContainer)}>{content}</div>;
  }
}

AssignmentTexterContactControls.propTypes = {
  // data
  contact: PropTypes.object,
  campaign: PropTypes.object,
  assignment: PropTypes.object,
  currentUser: PropTypes.object,
  texter: PropTypes.object,
  organizationId: PropTypes.string,

  // parent state
  disabled: PropTypes.bool,
  navigationToolbarChildren: PropTypes.object,
  messageStatusFilter: PropTypes.string,
  enabledSideboxes: PropTypes.arrayOf(PropTypes.object),
  review: PropTypes.string,

  // parent config/callbacks
  startingMessage: PropTypes.string,
  onMessageFormSubmit: PropTypes.func,
  onOptOut: PropTypes.func,
  onUpdateTags: PropTypes.func,
  onQuestionResponseChange: PropTypes.func,
  onCreateCannedResponse: PropTypes.func,
  onExitTexter: PropTypes.func,
  onEditStatus: PropTypes.func,
  refreshData: PropTypes.func,
  getMessageTextFromScript: PropTypes.func
};

export default AssignmentTexterContactControls;
