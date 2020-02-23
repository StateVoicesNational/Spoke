import PropTypes from "prop-types";
import React from "react";
import { StyleSheet, css } from "aphrodite";
import ContactToolbarNew from "../components/ContactToolbarNew";
import MessageList from "../components/MessageList";
import CannedResponseMenu from "../components/CannedResponseMenu";
import AssignmentTexterSurveys from "../components/AssignmentTexterSurveys";
import RaisedButton from "material-ui/RaisedButton";
import FlatButton from "material-ui/FlatButton";
import NavigateHomeIcon from "material-ui/svg-icons/action/home";
import NavigateBeforeIcon from "material-ui/svg-icons/image/navigate-before";
import NavigateNextIcon from "material-ui/svg-icons/image/navigate-next";
import ArrowBackIcon from "material-ui/svg-icons/navigation/arrow-back";
import ArrowForwardIcon from "material-ui/svg-icons/navigation/arrow-forward";
import { grey100 } from "material-ui/styles/colors";
import IconButton from "material-ui/IconButton/IconButton";
import { Toolbar, ToolbarGroup, ToolbarTitle } from "material-ui/Toolbar";
import { Card, CardActions, CardTitle } from "material-ui/Card";
import Divider from "material-ui/Divider";
import gql from "graphql-tag";
import yup from "yup";
import GSForm from "../components/forms/GSForm";
import Form from "react-formal";
import GSSubmitButton from "../components/forms/GSSubmitButton";
import SendButton from "../components/SendButton";
import SendButtonArrow from "../components/SendButtonArrow";
import CircularProgress from "material-ui/CircularProgress";
import Snackbar from "material-ui/Snackbar";
import {
  getChildren,
  getAvailableInteractionSteps,
  getTopMostParent,
  interactionStepForId,
  log,
  isBetweenTextingHours
} from "../lib";
import Empty from "../components/Empty";
import CreateIcon from "material-ui/svg-icons/content/create";
import { dataTest } from "../lib/attributes";
import { getContactTimezone } from "../lib/timezones";

const styles = StyleSheet.create({
  mobile: {
    "@media(min-width: 425px)": {
      display: "none !important"
    }
  },
  desktop: {
    "@media(max-width: 450px)": {
      display: "none !important"
    }
  },
  container: {
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
  optOutCard: {
    "@media(max-width: 320px)": {
      padding: "2px 10px !important"
    },
    zIndex: 2000,
    backgroundColor: "white"
  },
  messageForm: {
    backgroundColor: "red"
  },
  loadingIndicator: {
    maxWidth: "50%"
  },
  navigationToolbarTitle: {
    fontSize: "12px"
  },
  topFixedSection: {
    flex: "0 0 auto"
  },
  middleScrollingSection: {
    flex: "1 1 auto",
    overflowY: "scroll",
    overflow: "-moz-scrollbars-vertical",
    overflowX: "hidden"
  },
  textField: {
    "@media(max-width: 350px)": {
      overflowY: "scroll !important"
    }
  },
  dialogActions: {
    marginTop: 20,
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-end"
  },
  lgMobileToolBar: {
    "@media(max-width: 449px) and (min-width: 300px)": {
      display: "inline-block"
    },
    "@media(max-width: 320px) and (min-width: 300px)": {
      marginLeft: "-30px !important"
    }
  }
});

const inlineStyles = {
  mobileToolBar: {
    position: "absolute",
    bottom: "-5"
  },
  mobileCannedReplies: {
    "@media(max-width: 450px)": {
      marginBottom: "1"
    }
  },
  dialogButton: {
    display: "inline-block"
  },
  exitTexterIconButton: {
    float: "left",
    height: "56px",
    zIndex: 100,
    top: 0,
    left: "-20"
  },
  toolbarIconButton: {
    position: "absolute",
    top: 0
    // without this the toolbar icons are not centered vertically
  },
  actionToolbar: {
    backgroundColor: "white",
    "@media(min-width: 450px)": {
      marginBottom: 5
    },
    "@media(max-width: 450px)": {
      marginBottom: 50
    }
  },
  actionToolbarFirst: {
    backgroundColor: "white"
  },
  messageList: {
    backgroundColor: "#f0f0f0",
    flex: "2 4 auto",
    overflowY: "scroll",
    overflow: "-moz-scrollbars-vertical",
    overflowX: "hidden"
  },
  messageSent: {
    textAlign: "right",
    marginLeft: "30%",
    backgroundColor: "#009D52",
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
  },
  sendButton: {
    width: "100%",
    height: "100%",
    borderRadius: "0px"
  },
  flatButtonLabel: {
    textTransform: "none"
  }
};

const flexStyles = StyleSheet.create({
  sectionHeaderToolbar: {
    // see ContactToolbarNew component
  },
  /// * Section Scrolling Message Thread
  sectionMessageThread: {
    // middleScrollingSection: {
    flex: "1 1 auto",
    overflowY: "scroll",
    overflow: "-moz-scrollbars-vertical",
    overflowX: "hidden"
  },
  /// * Section OptOut Dialog
  sectionOptOutDialog: {
    // uses Card default
  },
  /// * Section Texting Input Field
  sectionMessageField: {
    // messageField
    flex: "2 0 20px",
    padding: "0px 4px",
    marginBottom: "8px"
  },
  /// * Section Reply/Exit Buttons
  sectionButtons: {
    // buttons
    flex: "4 0 130px", // stretches and shrinks more quickly than message
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
    padding: "9px"
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
      messageText: this.getStartingMessageText(),
      optOutDialogOpen: false,
      messageFocus: false,
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
  }

  componentWillUnmount() {
    document.body.removeEventListener("keydown", this.onEnter);
  }

  getStartingMessageText() {
    const { campaign, messageStatusFilter } = this.props;
    return messageStatusFilter === "needsMessage"
      ? this.props.getMessageTextFromScript(
          getTopMostParent(campaign.interactionSteps).script
        )
      : "";
  }

  onEnter = evt => {
    // FUTURE: consider disabling except in needsMessage
    if (evt.keyCode === 13) {
      evt.preventDefault();
      // pressing the Enter key submits
      if (!this.state.optOutDialogOpen) {
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
    this.setState({ optOutDialogOpen: true });
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

    this.setState(
      {
        questionResponses
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

  handleOpenPopover = event => {
    event.preventDefault();
    this.setState({
      responsePopoverAnchorEl: event.currentTarget,
      responsePopoverOpen: true
    });
  };

  handleClosePopover = () => {
    this.setState({
      responsePopoverOpen: false
    });
  };

  renderSurveySection() {
    const { campaign, contact } = this.props;
    const { questionResponses } = this.state;
    const { messages } = contact;

    const availableInteractionSteps = getAvailableInteractionSteps(
      questionResponses,
      campaign.interactionSteps
    );

    return (
      <AssignmentTexterSurveys
        contact={contact}
        interactionSteps={availableInteractionSteps}
        onQuestionResponseChange={this.handleQuestionResponseChange}
        currentInteractionStep={this.state.currentInteractionStep}
        questionResponses={questionResponses}
      />
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
        onRequestClose={this.handleClosePopover}
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
        <CardTitle className={css(styles.optOutCard)} title="Opt out user" />
        <Divider />
        <CardActions className={css(styles.optOutCard)}>
          <GSForm
            className={css(styles.optOutCard)}
            schema={this.optOutSchema}
            onChange={({ optOutMessageText }) =>
              this.setState({ optOutMessageText })
            }
            value={{ optOutMessageText: this.state.optOutMessageText }}
            onSubmit={this.props.onOptOut}
          >
            <Form.Field
              name="optOutMessageText"
              fullWidth
              autoFocus
              multiLine
            />
            <div className={css(styles.dialogActions)}>
              <FlatButton
                style={inlineStyles.dialogButton}
                label="Cancel"
                onTouchTap={this.handleCloseDialog}
              />
              <Form.Button
                type="submit"
                style={inlineStyles.dialogButton}
                component={GSSubmitButton}
                label={
                  this.state.optOutMessageText.length
                    ? "Send"
                    : "Opt Out without Text"
                }
              />
            </div>
          </GSForm>
        </CardActions>
      </Card>
    );
  }

  renderMessageSending() {
    console.log("renderMessageSending", this.props);
    const { contact, messageStatusFilter } = this.props;
    const { optOutDialogOpen } = this.state;
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
            className={css(styles.textField)}
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
    const currentQuestion = "Do you believe in love?";
    console.log(
      "REFS renderMessageSending return",
      message,
      this.refs.answerButtons && this.refs.answerButtons.offsetHeight
    );
    const quickButtonSpace =
      this.refs.answerButtons &&
      // 114=25(top q)+40(main btns)+40(xtra row)+9px(padding)
      this.refs.answerButtons.offsetHeight >= 105;
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
                <b>Current Question:</b> {currentQuestion}
              </div>
            ) : null}
            <div
              className={css(flexStyles.subSubAnswerButtonsColumns)}
              style={quickButtonSpace ? { height: "89px" } : null}
            >
              <FlatButton
                label={
                  <span>
                    Answer Q
                    <span className={css(flexStyles.flatButtonLabelMobile)}>
                      uestion
                    </span>
                  </span>
                }
                onTouchTap={this.handleOpenPopover}
                className={css(flexStyles.flatButton)}
                labelStyle={inlineStyles.flatButtonLabel}
                backgroundColor="white"
              />
              <div
                style={{
                  height: "40px",
                  position: "absolute",
                  top: "40px",
                  width: "100%",
                  padding: "9px 9px 0 9px"
                }}
              >
                <FlatButton
                  label={"Yes"}
                  onTouchTap={this.handleOpenPopover}
                  className={css(flexStyles.flatButton)}
                  labelStyle={inlineStyles.flatButtonLabel}
                  backgroundColor="white"
                />
                <FlatButton
                  label={"No"}
                  onTouchTap={this.handleOpenPopover}
                  className={css(flexStyles.flatButton)}
                  labelStyle={inlineStyles.flatButtonLabel}
                  backgroundColor="white"
                />
              </div>
            </div>
            <div
              className={css(flexStyles.subSubAnswerButtonsColumns)}
              style={{
                float: "right",
                marginRight: "18px",
                height: quickButtonSpace ? "89px" : "42px"
              }}
            >
              <FlatButton
                label="Other Responses"
                onTouchTap={this.handleOpenPopover}
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
        <RaisedButton
          {...dataTest("send")}
          onTouchTap={this.handleClickSendMessageButton}
          disabled={this.props.disabled}
          label={"Send"}
          style={inlineStyles.sendButton}
          primary
        />
      </div>,
      this.renderCannedResponsePopover()
    ];
  }

  render() {
    const { optOutDialogOpen } = this.state;
    console.log("AssignmentTexterContactNewControls", this.props);
    return (
      <div className={css(styles.container)}>
        <div className={css(styles.topFixedSection)}>
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
          className={css(styles.middleScrollingSection)}
        >
          <MessageList
            contact={this.props.contact}
            messages={this.props.contact.messages}
            styles={inlineStyles}
          />
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
