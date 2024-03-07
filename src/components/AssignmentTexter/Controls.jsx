import PropTypes from "prop-types";
import React from "react";
import { css } from "aphrodite";
import { compose } from "recompose";
import Toolbar from "./Toolbar";
import MessageList from "./MessageList";
import Survey from "./Survey";
import ScriptList from "./ScriptList";
import Empty from "../Empty";
import GSForm from "../forms/GSForm";
import GSTextField from "../forms/GSTextField";
import withMuiTheme from "../../containers/hoc/withMuiTheme";

import Card from "@material-ui/core/Card";
import CardHeader from "@material-ui/core/CardHeader";
import CardContent from "@material-ui/core/CardContent";
import Button from "@material-ui/core/Button";
import Popover from "@material-ui/core/Popover";
import SearchBar from "material-ui-search-bar";
import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";
import CreateIcon from "@material-ui/icons/Create";

import * as yup from "yup";
import Form from "react-formal";
import { messageListStyles, inlineStyles, flexStyles } from "./StyleControls";
import { searchFor } from "../../lib/search-helpers";
import AssignmentContactsList from "./AssignmentContactsList";
import { renderSidebox } from "../../extensions/texter-sideboxes/components";

import {
  getChildren,
  getAvailableInteractionSteps,
  getTopMostParent
} from "../../lib";

import { dataTest } from "../../lib/attributes";
import ContactToolbar from "./ContactToolbar";
import { getCookie, setCookie } from "../../lib/cookie";

export class AssignmentTexterContactControls extends React.Component {
  constructor(props) {
    super(props);

    this.formRef = React.createRef();

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

    let contactListOpen =
      global.ASSIGNMENT_CONTACTS_SIDEBAR &&
      document.documentElement.clientWidth > 575;

    const contactListOpenCookie = getCookie("assignmentContactListOpen");
    if (contactListOpenCookie) {
      contactListOpen = contactListOpenCookie === "true";
    }

    this.state = {
      questionResponses,
      filteredCannedResponses: props.campaign.cannedResponses,
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
      hideMedia: false,
      currentInteractionStep: this.getCurrentInteractionStep(availableSteps),
      contactListOpen
    };
  }

  componentDidMount() {
    const node = this.refs.messageScrollContainer;
    // Does not work without this setTimeout
    setTimeout(() => {
      node.scrollTop = Math.floor(node.scrollHeight);
    }, 0);
    const keyAction = window.HOLD_ENTER_KEY ? "keydown" : "keyup";
    document.body.addEventListener(keyAction, this.onKeyUp);
    document.body.addEventListener("keypress", this.blockWithCtrl);
    window.addEventListener("resize", this.onResize);
    window.addEventListener("orientationchange", this.onResize);
  }

  componentWillUnmount() {
    const keyAction = window.HOLD_ENTER_KEY ? "keydown" : "keyup";
    document.body.removeEventListener(keyAction, this.onKeyUp);
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

  getCurrentInteractionStep = availableSteps => {
    let currentInteractionStep = null;

    if (availableSteps.length > 0) {
      currentInteractionStep = availableSteps[availableSteps.length - 1];
      currentInteractionStep.question.filteredAnswerOptions =
        currentInteractionStep.question.answerOptions;
    }

    return currentInteractionStep;
  };

  getStartingMessageText() {
    const { contact, campaign } = this.props;
    return (
      contact != null &&
      contact.messageStatus === "needsMessage" &&
      this.props.getMessageTextFromScript(
        getTopMostParent(campaign.interactionSteps).script
      )
    );
  }

  onResize = evt => {
    // trigger re-render to determine whether there's space for shortcuts
    if (this.refs.answerButtons) {
      this.setState({
        currentShortcutSpace: this.refs.answerButtons.offsetHeight
      });
    }
  };

  getShortButtonText = (text, limit) => {
    var sanitizedText = text.replace(/^(\+|\-)/, "");
    return (
      sanitizedText.slice(0, limit) +
      (sanitizedText.length > limit ? "..." : "")
    );
  };

  toggleContactList = () => {
    this.setState({ contactListOpen: !this.state.contactListOpen }, () => {
      setCookie("assignmentContactListOpen", this.state.contactListOpen, 1);
    });
  };

  blockWithCtrl = evt => {
    // HACK: This blocks Ctrl-Enter from triggering 'click'
    // after a shortcut key has been pressed (instead of doing a send)
    if (evt.ctrlKey && evt.key === "Enter") {
      evt.preventDefault();
    }
  };

  onKeyUp = evt => {
    /* if the texter is entering text in sidebars that allow input
       ignore this listener, space/enter will send texts otherwise.

       NOTE: `id` attr on the input(s) must match what is defined here */
    const texterSideboxesThatAllowInput = ["contact-notes"];

    if (evt.target && texterSideboxesThatAllowInput.includes(evt.target.id)) {
      return;
    }

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
        this.props.contact.messageStatus
      );
    }

    if (
      // SEND: Ctrl-> OR Ctrl-.
      (evt.key === ">" || evt.key === ".") &&
      // need to use ctrlKey in non-first texting context for accessibility
      evt.ctrlKey
    ) {
      this.props.handleNavigateNext();
    }

    if (
      // SEND: Ctrl-< OR Ctrl-,
      (evt.key === "<" || evt.key === ",") &&
      // need to use ctrlKey in non-first texting context for accessibility
      evt.ctrlKey
    ) {
      this.props.handleNavigatePrevious();
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
      this.props.contact.messageStatus === "needsMessage" &&
      this.state.messageReadOnly &&
      !evt.ctrlKey &&
      !evt.metaKey &&
      !evt.altKey &&
      (evt.key === "Enter" ||
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
      this.formRef.current.submit();
      this.setState({ doneFirstClick: false });
    }
  };

  handleSearchChange = searchValue => {
    // filter answerOptions for this step's question
    const answerOptions = this.state.currentInteractionStep.question
      .answerOptions;
    const filteredAnswerOptions = searchFor(searchValue, answerOptions, [
      "value",
      "nextInteractionStep.script"
    ]);
    this.state.currentInteractionStep.question.filteredAnswerOptions = filteredAnswerOptions;

    const filteredCannedResponses = searchFor(
      searchValue,
      this.props.campaign.cannedResponses,
      ["title", "text"]
    );

    this.setState({
      currentInteractionStep: this.state.currentInteractionStep,
      filteredCannedResponses
    });
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
    console.log(
      "handleQuestionResponseChange",
      questionResponseValue,
      nextScript,
      "interactionStep",
      interactionStep
    );
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
    this.setState(
      {
        questionResponses,
        availableSteps,

        // Update currentInteractionStep if a response was cleared
        currentInteractionStep: questionResponseValue
          ? this.state.currentInteractionStep
          : this.getCurrentInteractionStep(availableSteps)
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

  handleOpenAnswerResponsePopover = event => {
    event.preventDefault();
    const newState = {
      answerPopoverAnchorEl: event.currentTarget,
      answerPopoverOpen: true,
      responsePopoverAnchorEl: event.currentTarget,
      responsePopoverOpen: true,
      filteredCannedResponses: this.props.campaign.cannedResponses
    };
    if (this.state.currentInteractionStep) {
      this.state.currentInteractionStep.question.filteredAnswerOptions = this.state.currentInteractionStep.question.answerOptions;
      newState.currentInteractionStep = this.state.currentInteractionStep;
    }
    this.setState(newState);
  };

  handleCloseAnswerResponsePopover = () => {
    this.setState({
      answerPopoverOpen: false
    });

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
      cannedResponseScript,
      currentInteractionStep,
      filteredCannedResponses
    } = this.state;
    const { messages } = contact;

    const availableInteractionSteps = getAvailableInteractionSteps(
      questionResponses,
      campaign.interactionSteps
    );

    const otherResponsesLink =
      currentInteractionStep &&
      currentInteractionStep.question.filteredAnswerOptions.length > 6 &&
      filteredCannedResponses.length ? (
        <div className={css(flexStyles.popoverLink)} key={"otherresponses"}>
          <a
            href="#otherresponses"
            className={css(flexStyles.popoverLinkColor)}
          >
            Other Responses
          </a>
        </div>
      ) : null;

    const searchBar = currentInteractionStep &&
      currentInteractionStep.question.answerOptions.length +
        campaign.cannedResponses.length >
        5 && (
        <SearchBar
          onRequestSearch={this.handleSearchChange}
          onChange={this.handleSearchChange}
          value={""}
          placeholder={"Search replies..."}
        />
      );

    return (
      <Popover
        key="renderSurveySection"
        classes={{
          paper: css(flexStyles.popover)
        }}
        open={answerPopoverOpen}
        anchorEl={this.state.answerPopoverAnchorEl}
        anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
        transformOrigin={{ horizontal: "left", vertical: "bottom" }}
        onClose={this.handleCloseAnswerResponsePopover}
      >
        {searchBar}
        {!global.HIDE_BRANCHED_SCRIPTS ? (
          <Survey
            contact={contact}
            interactionSteps={availableInteractionSteps}
            onQuestionResponseChange={this.handleQuestionResponseChange}
            currentInteractionStep={currentInteractionStep}
            listHeader={otherResponsesLink}
            questionResponses={questionResponses}
            onRequestClose={this.handleCloseAnswerResponsePopover}
          />
        ) : (
          ""
        )}
        <ScriptList
          scripts={filteredCannedResponses}
          showAddScriptButton={false}
          customFields={campaign.customFields}
          currentCannedResponseScript={cannedResponseScript}
          subheader={
            global.HIDE_BRANCHED_SCRIPTS ? (
              ""
            ) : (
              <div id="otherresponses">Other Responses</div>
            )
          }
          onSelectCannedResponse={this.handleCannedResponseChange}
          onCreateCannedResponse={this.props.onCreateCannedResponse}
        />
      </Popover>
    );
  }

  renderNeedsResponseToggleButton(contact) {
    const { messageStatus } = contact;
    let button = null;
    if (messageStatus !== "needsMessage") {
      const status = this.state.messageStatus || messageStatus;
      const onClick = (newStatus, finishContact) => async () => {
        const res = await this.props.onEditStatus(newStatus, finishContact);
        if (
          res &&
          res.data &&
          res.data.editCampaignContactMessageStatus &&
          res.data.editCampaignContactMessageStatus.messageStatus
        ) {
          this.setState({
            messageStatus:
              res.data.editCampaignContactMessageStatus.messageStatus
          });
        }
      };
      if (status === "closed") {
        button = (
          <Button
            onClick={onClick("needsResponse")}
            style={{
              color: this.props.muiTheme.palette.text.primary,
              backgroundColor: this.props.muiTheme.palette.background.default
            }}
            style={{ flex: "1 1 auto" }}
            disabled={!!this.props.contact.optOut}
            color="default"
            variant="contained"
          >
            Reopen
          </Button>
        );
      } else {
        button = (
          <Button
            onClick={onClick("closed", true)}
            style={{
              color: this.props.muiTheme.palette.text.primary,
              backgroundColor: this.props.muiTheme.palette.background.default
            }}
            disabled={!!this.props.contact.optOut}
            color="default"
            variant="contained"
          >
            Skip
          </Button>
        );
      }
    }
    return button;
  }

  renderOptOutDialog() {
    if (!this.state.optOutDialogOpen) {
      return null;
    }
    return (
      <Card className={css(flexStyles.sectionOptOutDialog)}>
        <CardHeader title="Opt out user" />
        <CardContent className={css(flexStyles.sectionOptOutDialog)}>
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
              <Button
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
                onClick={() => {
                  this.setState({
                    optOutMessageText: this.props.campaign.organization
                      .optOutMessage
                  });
                }}
                variant="contained"
              >
                Standard Message
              </Button>
              <Button
                style={{
                  margin: "0 9px 0 9px",
                  color:
                    this.state.optOutMessageText === "" ? "white" : "#494949",
                  backgroundColor:
                    this.state.optOutMessageText === "" ? "#727272" : "white"
                }}
                onClick={() => {
                  this.setState({ optOutMessageText: "" });
                }}
                variant="contained"
              >
                No Message
              </Button>
            </div>
            <Form.Field
              as={GSTextField}
              name="optOutMessageText"
              fullWidth
              multiline
              rows={2}
            />
            <div className={css(flexStyles.subSectionOptOutDialogActions)}>
              <Button
                className={css(flexStyles.button)}
                style={inlineStyles.inlineBlock}
                onClick={this.handleCloseDialog}
                variant="outlined"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                style={{
                  ...inlineStyles.inlineBlock,
                  borderColor: "#790000",
                  color: "white",
                  marginLeft: "9px",
                  backgroundColor: "#BC0000"
                }}
                variant="contained"
              >
                &crarr; Opt-Out
              </Button>
            </div>
          </GSForm>
        </CardContent>
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
        key="renderMessagingRowMessage"
        className={css(flexStyles.sectionMessageField)}
        style={isFeedbackEnabled ? { width: "calc(100% - 390px)" } : undefined}
      >
        <GSForm
          setRef={this.formRef}
          schema={this.messageSchema}
          value={{ messageText: this.state.messageText || "" }}
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
            as={GSTextField}
            className={css(flexStyles.subSectionMessageFieldTextField)}
            name="messageText"
            label="Your message"
            onFocus={() => {
              this.setState({ messageFocus: true });
            }}
            onBlur={() => {
              this.setState({ messageFocus: false });
            }}
            multiline
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
      cannedResponseScript,
      messageText
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
      if (global.HIDE_BRANCHED_SCRIPTS) {
        if (cannedResponseScript) {
          shortCannedResponses = [cannedResponseScript];
        } else {
          const messageTextLowerCase = (messageText || "").toLowerCase();

          shortCannedResponses = campaign.cannedResponses.filter(
            script =>
              script.title.toLowerCase().includes(messageTextLowerCase) ||
              script.text.toLowerCase().includes(messageTextLowerCase)
          );
        }
      } else {
        shortCannedResponses = campaign.cannedResponses.filter(
          // allow for "Wrong Number", prefixes of + or - can force add or remove
          script =>
            (script.title.length < 13 || script.title[0] === "+") &&
            script.title[0] !== "-"
        );
      }

      shortCannedResponses = shortCannedResponses.filter(script => {
        var textLength = global.HIDE_BRANCHED_SCRIPTS
          ? this.getShortButtonText(
              script.title,
              cannedResponseScript ? 40 : 13
            ).length
          : script.title.length;

        if (joinedLength + 1 + textLength < 80) {
          joinedLength += 1 + textLength;
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
          <Button
            key={`shortcutStep_${opt.answer.value}`}
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
            style={{
              marginRight: "9px",
              backgroundColor: isCurrentAnswer(opt) ? "#727272" : "white",
              color: isCurrentAnswer(opt) ? "white" : "#494949"
            }}
            variant="outlined"
          >
            {opt.label}
          </Button>
        ))}
        {shortCannedResponses.map(script => (
          <Button
            key={`shortcutScript_${script.id}`}
            onClick={evt => {
              this.handleCannedResponseChange(script);
            }}
            style={{
              marginRight: "9px",
              color: isCurrentCannedResponse(script) ? "white" : "#494949",
              backgroundColor: isCurrentCannedResponse(script)
                ? "#727272"
                : "white"
            }}
            title={script.title}
            variant="outlined"
          >
            {this.getShortButtonText(
              script.title,
              cannedResponseScript ? 40 : 13
            )}
          </Button>
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
        <Button
          onClick={
            !disabled ? this.handleOpenAnswerResponsePopover : noAction => {}
          }
          style={{
            backgroundColor: this.props.muiTheme.palette.background.default,
            color: this.props.muiTheme.palette.text.primary
          }}
          disabled={disabled}
          variant="outlined"
        >
          All Responses{" "}
          <ArrowDropDownIcon style={{ verticalAlign: "middle" }} />
        </Button>

        <Button
          {...dataTest("optOut")}
          onClick={this.handleOpenDialog}
          style={{
            color: this.props.muiTheme.palette.error.main,
            backgroundColor: this.props.muiTheme.palette.background.default
          }}
          disabled={!!this.props.contact.optOut}
          variant="contained"
        >
          Opt-out
        </Button>
      </div>
    );
  }

  renderMessagingRowSendSkip(contact) {
    const firstMessage = contact.messageStatus === "needsMessage";
    return (
      <div
        key="renderMessagingRowSendSkip"
        className={css(flexStyles.sectionSend)}
        style={{ height: "54px" }}
      >
        <Button
          {...dataTest("send")}
          onClick={this.handleClickSendMessageButton}
          disabled={this.props.disabled || !!this.props.contact.optOut}
          style={{
            width: "70%"
          }}
          color="primary"
          variant="contained"
        >
          &crarr; Send
        </Button>
        {this.renderNeedsResponseToggleButton(contact)}
      </div>
    );
  }

  renderMessageControls(enabledSideboxes) {
    const { contact, assignment, campaign } = this.props;
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
          {currentQuestion &&
            this.renderMessagingRowCurrentQuestion(
              currentQuestion,
              currentQuestionAnswered
            )}
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
    const sideboxList = enabledSideboxes.map(sidebox =>
      renderSidebox(sidebox, settingsData, this)
    );
    const sideboxOpen = this.getSideboxDialogOpen(enabledSideboxes);
    if (sideboxOpen) {
      return (
        <Popover
          className={css(flexStyles.popover)}
          classes={{
            paper: css(flexStyles.popoverSideboxesInner)
          }}
          open={sideboxOpen}
          anchorEl={this.refs.messageBox}
          anchorOrigin={{ horizontal: "middle", vertical: "middle" }}
          transformOrigin={{ horizontal: "middle", vertical: "middle" }}
          onClose={this.handleClickSideboxDialog}
        >
          {sideboxList}
        </Popover>
      );
    }
    // TODO: max height
    return (
      <div className={css(flexStyles.sectionSideBox)}>
        <div className={css(flexStyles.sectionSideBoxHeader)} />
        <div className={css(flexStyles.sectionSideBoxContent)}>
          {sideboxList}
        </div>
      </div>
    );
  }

  renderMessageBox(internalComponent, enabledSideboxes) {
    const isFeedbackEnabled =
      !!enabledSideboxes &&
      !!enabledSideboxes.find(sidebox => sidebox.name === "texter-feedback");
    return (
      <div
        ref="messageBox"
        key="renderMessageBox"
        className={css(flexStyles.superSectionMessageBox)}
        style={isFeedbackEnabled ? { width: "calc(100% - 382px)" } : undefined}
      >
        <div
          {...dataTest("messageList")}
          key="messageScrollContainer"
          ref="messageScrollContainer"
          className={css(flexStyles.sectionMessageThread)}
          style={{
            backgroundColor:
              this.props.muiTheme.palette.type === "light"
                ? "#f0f0f0"
                : this.props.muiTheme.palette.grey[700]
          }}
        >
          {internalComponent}
        </div>
        {this.renderSidebox(enabledSideboxes)}
      </div>
    );
  }

  renderAssignmentContactsList = () => {
    return (
      <div className={css(flexStyles.sectionLeftSideBox)}>
        <AssignmentContactsList
          contacts={this.props.assignment.contacts}
          currentContact={this.props.contact}
          updateCurrentContactById={this.props.updateCurrentContactById}
        />
      </div>
    );
  };

  renderFirstMessage(enabledSideboxes) {
    const { contact } = this.props;
    return [
      this.renderToolbar(enabledSideboxes),
      <ContactToolbar
        key="contactToolbar"
        campaignContact={this.props.contact}
        campaign={this.props.campaign}
        navigationToolbarChildren={this.props.navigationToolbarChildren}
        toggleContactList={() =>
          this.setState({ contactListOpen: !this.state.contactListOpen })
        }
      />,
      this.renderMessageBox(
        <Empty
          title={
            contact.optOut
              ? `${contact.firstName} is opted out -- skip this contact`
              : `This is your first message to ${contact.firstName}`
          }
          icon={<CreateIcon color="primary" />}
        />,
        enabledSideboxes
      ),
      this.renderMessagingRowMessage(),
      this.renderMessagingRowSendSkip(contact)
    ];
  }

  render() {
    const { enabledSideboxes } = this.props;
    const firstMessage = this.props.contact.messageStatus === "needsMessage";
    const content = firstMessage
      ? this.renderFirstMessage(enabledSideboxes)
      : [
          this.renderToolbar(enabledSideboxes),
          <div
            key="superSectionMessagePage"
            className={css(flexStyles.superSectionMessagePage)}
          >
            {this.state.contactListOpen &&
              this.renderAssignmentContactsList(
                this.props.assignment.contacts,
                this.props.contact,
                this.props.updateCurrentContactById
              )}
            <div className={css(flexStyles.superSectionMessageListAndControls)}>
              <ContactToolbar
                campaignContact={this.props.contact}
                campaign={this.props.campaign}
                navigationToolbarChildren={this.props.navigationToolbarChildren}
                toggleContactList={this.toggleContactList}
              />
              {this.renderMessageBox(
                <MessageList
                  contact={this.props.contact}
                  currentUser={this.props.currentUser}
                  messages={this.props.contact.messages}
                  organizationId={this.props.organizationId}
                  review={this.props.review}
                  styles={messageListStyles}
                  hideMedia={this.state.hideMedia}
                />,
                enabledSideboxes
              )}
              {this.renderMessageControls(enabledSideboxes)}
            </div>
          </div>
        ];
    return (
      <div
        className={css(flexStyles.topContainer)}
        style={{
          backgroundColor:
            this.props.muiTheme.palette.type === "light"
              ? "#d6d7df"
              : this.props.muiTheme.palette.grey[800]
        }}
      >
        {content}
      </div>
    );
  }
}

AssignmentTexterContactControls.propTypes = {
  // data
  handleNavigateNext: PropTypes.func,
  handleNavigatePrevious: PropTypes.func,
  contact: PropTypes.object,
  campaign: PropTypes.object,
  assignment: PropTypes.object,
  currentUser: PropTypes.object,
  texter: PropTypes.object,
  organizationId: PropTypes.string,

  // parent state
  disabled: PropTypes.bool,
  navigationToolbarChildren: PropTypes.object,
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
  getMessageTextFromScript: PropTypes.func,
  updateCurrentContactById: PropTypes.func
};

export default withMuiTheme(AssignmentTexterContactControls);
