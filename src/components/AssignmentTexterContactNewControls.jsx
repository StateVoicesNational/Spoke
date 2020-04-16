import PropTypes from "prop-types";
import React from "react";
import { StyleSheet, css } from "aphrodite";
import ContactToolbarNew from "../components/ContactToolbarNew";
import MessageList from "../components/MessageList";
import CannedResponseMenu from "../components/CannedResponseMenu";
import AssignmentTexterSurveys from "../components/AssignmentTexterSurveys";
import Empty from "../components/Empty";
import GSForm from "../components/forms/GSForm";
import RaisedButton from "material-ui/RaisedButton";
import FlatButton from "material-ui/FlatButton";
import NavigateHomeIcon from "material-ui/svg-icons/action/home";
import ArrowBackIcon from "material-ui/svg-icons/navigation/arrow-back";
import ArrowForwardIcon from "material-ui/svg-icons/navigation/arrow-forward";
import IconButton from "material-ui/IconButton/IconButton";
import { Card, CardActions, CardTitle } from "material-ui/Card";
import Divider from "material-ui/Divider";
import CreateIcon from "material-ui/svg-icons/content/create";
import yup from "yup";
import theme from "../styles/theme";
import Form from "react-formal";
import Popover from "material-ui/Popover";

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
    overflow: "-moz-scrollbars-vertical"
  },
  messageSent: {
    textAlign: "right",
    marginLeft: "30%",
    backgroundColor: theme.colors.coreBackgroundColor,
    color: "white",
    borderRadius: "16px",
    fontWeight: "600",
    marginBottom: "10px",
    fontSize: "13px"
  },
  messageReceived: {
    fontSize: "13px",
    marginRight: "30%",
    backgroundColor: "white",
    borderRadius: "16px",
    fontWeight: "600",
    fontSize: "105%",
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
    textTransform: "none"
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
    height: "100%"
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
    backgroundColor: "white"
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
    marginBottom: "8px"
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
      flexBasis: "130px"
    },
    "@media(min-height: 600px)": {
      flexBasis: "190px"
    },
    flexGrow: "0",
    flexShrink: "0",
    // flexBasis: ${130px|190px}", // stretches and shrinks more quickly than message
    flexDirection: "column",
    display: "flex",
    // flexWrap: "wrap",
    overflow: "hidden",
    position: "relative",
    backgroundColor: "rgb(240, 240, 240)"
  },
  subButtonsAnswerButtons: {
    flex: "1 1 80px", // keeps bottom buttons in place
    // height:105: webkit needs constraint on height sometimes
    //   during the inflection point of showing the shortcut-buttons
    //   without the height, the exit buttons get pushed down oddly
    height: "105px",
    // internal:
    margin: "9px 0px 0px 9px",
    width: "100%",
    // similar to 572 below, but give room for other shortcut-buttons
    maxWidth: "820px"
  },
  subSubButtonsAnswerButtonsCurrentQuestion: {
    marginBottom: "4px",
    //flex: "0 0 auto",
    width: "100%",
    // for mobile:
    whiteSpace: "nowrap",
    overflow: "hidden"
  },
  subSubAnswerButtonsColumns: {
    "@media(min-width: 450px)": {
      // mobile crunch gives up on 50%, so only bigger
      width: "46%"
    },
    "@media(min-height: 600px)": {
      height: "89px"
    },
    display: "inline-block",
    //flex: "1 1 50%",
    overflow: "hidden",
    position: "relative"
  },
  subButtonsExitButtons: {
    // next/prev/skip/optout
    // width: "100%", default is better on mobile
    maxWidth: "572px",
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
    backgroundColor: "rgb(240, 240, 240)",
    zIndex: "10"
  },
  /// * Section Send Button
  sectionSend: {
    //sendButtonWrapper
    //flex: `0 0 ${sendButtonHeight}`, VARIABLE BELOW
    //height: ${sendButtonHeight}, VARIABLE BELOW
    padding: "9px",
    backgroundColor: "rgb(240, 240, 240)"
  },
  subSectionSendButton: {
    width: "100%",
    height: "100%",
    borderRadius: "0px",
    color: "white"
  },
  flatButton: {
    height: "40px",
    border: "1px solid #949494",
    // FlatButton property, setting here, overrides hover
    // backgroundColor: "white",
    borderRadius: "0",
    boxShadow: "none",
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
    this.handleChangeScript(cannedResponseScript);
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
    const messageText = this.props.getMessageTextFromScript(newScript);

    this.setState({
      messageText
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
    const { campaign, contact } = this.props;
    const { answerPopoverOpen, questionResponses } = this.state;
    const { messages } = contact;

    const availableInteractionSteps = getAvailableInteractionSteps(
      questionResponses,
      campaign.interactionSteps
    );

    return (
      <Popover
        style={inlineStyles.popover}
        open={answerPopoverOpen}
        anchorEl={this.state.answerPopoverAnchorEl}
        anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
        targetOrigin={{ horizontal: "left", vertical: "bottom" }}
        onRequestClose={this.handleCloseAnswerPopover}
        style={{
          overflowY: "scroll",
          width: "75%"
        }}
      >
        <AssignmentTexterSurveys
          contact={contact}
          interactionSteps={availableInteractionSteps}
          onQuestionResponseChange={this.handleQuestionResponseChange}
          currentInteractionStep={this.state.currentInteractionStep}
          questionResponses={questionResponses}
          onRequestClose={this.handleCloseAnswerPopover}
        />
      </Popover>
    );
  }

  renderNeedsResponseToggleButton(contact) {
    const { messageStatus } = contact;
    let button = null;
    if (messageStatus === "closed") {
      button = (
        <FlatButton
          onTouchTap={() => this.props.onEditStatus("needsResponse")}
          label="Reopen"
          className={css(flexStyles.flatButton)}
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
          labelStyle={inlineStyles.flatButtonLabel}
          backgroundColor="white"
        />
      );
    }

    return button;
  }

  renderCannedResponsePopover() {
    const { campaign, assignment, texter } = this.props;
    const { userCannedResponses, campaignCannedResponses } = assignment;

    return (
      <CannedResponseMenu
        onRequestClose={this.handleCloseResponsePopover}
        open={this.state.responsePopoverOpen}
        anchorEl={this.state.responsePopoverAnchorEl}
        campaignCannedResponses={campaignCannedResponses}
        userCannedResponses={userCannedResponses}
        customFields={campaign.customFields}
        onSelectCannedResponse={this.handleCannedResponseChange}
        onCreateCannedResponse={this.props.onCreateCannedResponse}
      />
    );
  }

  renderOptOutDialog() {
    if (!this.state.optOutDialogOpen) {
      return "";
    }
    return (
      <Card>
        <CardTitle
          className={css(flexStyles.sectionOptOutDialog)}
          title="Opt out user"
        />
        <Divider />
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
                justifyContent: "flex-end"
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
                  color: "white"
                }}
                backgroundColor="#BC0000"
                label={
                  this.state.optOutMessageText.length ? (
                    <span>&crarr; Opt-Out</span>
                  ) : (
                    <span>&crarr; Opt-Out without Text</span>
                  )
                }
              />
            </div>
          </GSForm>
        </CardActions>
      </Card>
    );
  }

  renderMessageSending() {
    const { contact, messageStatusFilter } = this.props;
    const {
      optOutDialogOpen,
      availableSteps,
      questionResponses,
      currentInteractionStep
    } = this.state;
    const firstMessage = messageStatusFilter === "needsMessage";

    const message = (
      <div className={css(flexStyles.sectionMessageField)}>
        <GSForm
          ref="form"
          schema={this.messageSchema}
          value={{ messageText: this.state.messageText }}
          onSubmit={this.props.onMessageFormSubmit}
          onChange={firstMessage ? "" : this.handleMessageFormChange}
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

    const sendButtonHeight = firstMessage ? "40%" : "36px";
    let currentQuestion = null;
    let currentQuestionAnswered = null;
    let currentQuestionOptions = null;
    if (currentInteractionStep) {
      currentQuestion = currentInteractionStep.question;
      currentQuestionAnswered = questionResponses[currentInteractionStep.id];
      currentQuestionOptions = currentQuestion.answerOptions.map(answer => {
        const label = answer.value.match(/^(\w+)([^\s\w]|$)/);
        return {
          answer: answer,
          label: label ? label[1] : "Yes__No__Maybe__toomuch"
        };
      });
      const joinedLength = currentQuestionOptions.map(o => o.label).join("__");
      if (joinedLength.length > 14) {
        // too many/long options
        currentQuestionOptions = null;
      }
    }
    const shortcutButtonSpace =
      // 114=25(top q)+40(main btns)+40(xtra row)+9px(padding)
      ((this.refs.answerButtons && this.refs.answerButtons.offsetHeight) ||
        this.state.currentShortcutSpace) >= 114;
    return [
      message,
      firstMessage ? null : (
        <div className={css(flexStyles.sectionButtons)}>
          <div
            className={css(flexStyles.subButtonsAnswerButtons)}
            ref="answerButtons"
          >
            {currentQuestion ? (
              <div
                className={css(
                  flexStyles.subSubButtonsAnswerButtonsCurrentQuestion
                )}
              >
                {currentQuestionAnswered ? (
                  <span>
                    {currentQuestion.text}: <b>{currentQuestionAnswered}</b>
                  </span>
                ) : (
                  <span>
                    <b>Current Question:</b> {currentQuestion.text}
                  </span>
                )}
              </div>
            ) : null}
            <div className={css(flexStyles.subSubAnswerButtonsColumns)}>
              <FlatButton
                label={
                  <span>
                    Answer Q
                    <span className={css(flexStyles.flatButtonLabelMobile)}>
                      uestion
                    </span>
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
              {currentQuestionOptions ? (
                <div
                  style={{
                    height: "40px",
                    position: "absolute",
                    top: "40px",
                    width: "100%",
                    padding: "9px"
                  }}
                >
                  {currentQuestionOptions.map(opt => (
                    <FlatButton
                      key={`shortcut_${opt.answer.value}`}
                      label={opt.label}
                      onTouchTap={evt => {
                        this.handleQuestionResponseChange({
                          interactionStep: currentInteractionStep,
                          questionResponseValue: opt.answer.value,
                          nextScript:
                            (opt.answer.nextInteractionStep &&
                              opt.answer.nextInteractionStep.script) ||
                            null
                        });
                      }}
                      className={css(flexStyles.flatButton)}
                      style={{ marginLeft: "9px" }}
                      labelStyle={{
                        ...inlineStyles.flatButtonLabel,
                        color:
                          opt.answer.value ===
                          questionResponses[currentInteractionStep.id]
                            ? "white"
                            : "#494949"
                      }}
                      backgroundColor={
                        opt.answer.value ===
                        questionResponses[currentInteractionStep.id]
                          ? "#727272"
                          : "white"
                      }
                    />
                  ))}
                </div>
              ) : null}
            </div>
            <div
              className={css(flexStyles.subSubAnswerButtonsColumns)}
              style={{
                float: "right",
                marginRight: "18px"
              }}
            >
              <FlatButton
                label="Other Responses"
                onTouchTap={this.handleOpenResponsePopover}
                className={css(flexStyles.flatButton)}
                labelStyle={inlineStyles.flatButtonLabel}
                backgroundColor="white"
              />
            </div>
          </div>
          <div className={css(flexStyles.subButtonsExitButtons)}>
            <FlatButton
              onTouchTap={this.props.navigationToolbarChildren.onPrevious}
              disabled={!this.props.navigationToolbarChildren.onPrevious}
              tooltip="Previous Contact"
              tooltipPosition="button-center"
              className={css(flexStyles.flatButton)}
              style={{ paddingTop: "6px" }}
              label={<ArrowBackIcon />}
              backgroundColor={
                this.props.navigationToolbarChildren.onPrevious
                  ? "white"
                  : "rgb(176, 176, 176)"
              }
            />

            {this.renderNeedsResponseToggleButton(contact)}

            <FlatButton
              {...dataTest("optOut")}
              secondary
              label="Opt-out"
              onTouchTap={this.handleOpenDialog}
              tooltip="Opt out this contact"
              className={css(flexStyles.flatButton)}
              labelStyle={inlineStyles.flatButtonLabel}
              backgroundColor="white"
            />

            <FlatButton
              onTouchTap={this.props.navigationToolbarChildren.onNext}
              disabled={!this.props.navigationToolbarChildren.onNext}
              tooltip="Next Contact"
              tooltipPosition="bottom-center"
              label={<ArrowForwardIcon />}
              className={css(flexStyles.flatButton)}
              style={{ paddingTop: "6px" }}
              backgroundColor={
                this.props.navigationToolbarChildren.onNext
                  ? "white"
                  : "rgb(176, 176, 176)"
              }
              labelStyle={inlineStyles.flatButtonLabel}
            />
          </div>
        </div>
      ),
      <div
        className={css(flexStyles.sectionSend)}
        style={{ flex: `0 0 ${sendButtonHeight}`, height: sendButtonHeight }}
      >
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
      </div>,
      this.renderCannedResponsePopover(),
      this.renderSurveySection()
    ];
  }

  render() {
    const { optOutDialogOpen } = this.state;
    return (
      <div className={css(flexStyles.topContainer)}>
        <div className={css(flexStyles.sectionHeaderToolbar)}>
          <ContactToolbarNew
            campaign={this.props.campaign}
            campaignContact={this.props.contact}
            navigationToolbarChildren={this.props.navigationToolbarChildren}
            leftToolbarIcon={
              <IconButton
                onTouchTap={this.props.onExitTexter}
                style={inlineStyles.exitTexterIconButton}
                tooltip="Return Home"
                tooltipPosition="bottom-center"
              >
                <NavigateHomeIcon color={"white"} />
              </IconButton>
            }
          />
        </div>
        <div
          {...dataTest("messageList")}
          ref="messageScrollContainer"
          className={css(flexStyles.sectionMessageThread)}
        >
          {this.props.messageStatusFilter === "needsMessage" ? (
            <Empty
              title={
                "This is your first message to " + this.props.contact.firstName
              }
              icon={<CreateIcon color="rgb(83, 180, 119)" />}
              hideMobile
            />
          ) : (
            <MessageList
              contact={this.props.contact}
              messages={this.props.contact.messages}
              styles={messageListStyles}
            />
          )}
        </div>
        {optOutDialogOpen
          ? this.renderOptOutDialog()
          : this.renderMessageSending()}
      </div>
    );
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
