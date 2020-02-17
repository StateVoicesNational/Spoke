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
  bottomFixedSection: {
    borderTop: `1px solid ${grey100}`,
    flex: "1 0 auto",
    marginBottom: "none"
  },
  messageField: {
    flex: "2 0 20px",
    padding: "0px 4px",
    marginBottom: "8px"
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
  }
};

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

  renderMiddleScrollingSection() {
    const { contact } = this.props;
    return (
      <MessageList
        contact={contact}
        messages={contact.messages}
        styles={inlineStyles}
      />
    );
  }

  renderSurveySection() {
    const { campaign, contact } = this.props;
    const { questionResponses } = this.state;
    const { messages } = contact;

    const availableInteractionSteps = getAvailableInteractionSteps(
      questionResponses,
      campaign.interactionSteps
    );

    return messages.length === 0 ? (
      <Empty
        title={"This is your first message to " + contact.firstName}
        icon={<CreateIcon color="rgb(83, 180, 119)" />}
        hideMobile
      />
    ) : (
      <div>
        <AssignmentTexterSurveys
          contact={contact}
          interactionSteps={availableInteractionSteps}
          onQuestionResponseChange={this.handleQuestionResponseChange}
          currentInteractionStep={this.state.currentInteractionStep}
          questionResponses={questionResponses}
        />
      </div>
    );
  }

  renderNeedsResponseToggleButton(contact) {
    const { messageStatus } = contact;
    let button = null;
    if (messageStatus === "closed") {
      button = (
        <RaisedButton
          onTouchTap={() => this.props.onEditStatus("needsResponse")}
          label="Reopen"
        />
      );
    } else if (messageStatus === "needsResponse") {
      button = (
        <RaisedButton
          onTouchTap={() => this.props.onEditStatus("closed", true)}
          label="Skip"
        />
      );
    }

    return button;
  }

  renderActionToolbar() {
    const {
      contact,
      campaign,
      assignment,
      navigationToolbarChildren,
      onFinishContact,
      messageStatusFilter
    } = this.props;
    const { messageStatus } = contact;
    const size = document.documentElement.clientWidth;

    let navigationToolbar = [];
    if (navigationToolbarChildren) {
      const { onNext, onPrevious, title } = navigationToolbarChildren;

      navigationToolbar = [
        <ToolbarTitle
          className={css(styles.navigationToolbarTitle)}
          text={title}
        />,
        <IconButton onTouchTap={onPrevious} disabled={!onPrevious}>
          <NavigateBeforeIcon />
        </IconButton>,
        <IconButton onTouchTap={onNext} disabled={!onNext}>
          <NavigateNextIcon />
        </IconButton>
      ];
    }

    if (messageStatusFilter === "needsMessage") {
      return (
        <div>
          <Toolbar style={inlineStyles.actionToolbarFirst}>
            <ToolbarGroup firstChild>
              <SendButton
                threeClickEnabled={false}
                onFinalTouchTap={this.handleClickSendMessageButton}
                disabled={this.props.disabled}
              />
              <div style={{ float: "right", marginLeft: 20 }}>
                {navigationToolbar}
              </div>
            </ToolbarGroup>
          </Toolbar>
        </div>
      );
    } else if (size < 450) {
      // for needsResponse or messaged or convo
      return (
        <div>
          <Toolbar
            className={css(styles.mobile)}
            style={inlineStyles.actionToolbar}
          >
            <ToolbarGroup
              style={inlineStyles.mobileToolBar}
              className={css(styles.lgMobileToolBar)}
              firstChild
            >
              <RaisedButton
                {...dataTest("optOut")}
                secondary
                label="Opt out"
                onTouchTap={this.handleOpenDialog}
                tooltip="Opt out this contact"
              />
              <RaisedButton
                style={inlineStyles.mobileCannedReplies}
                label="Canned replies"
                onTouchTap={this.handleOpenPopover}
              />
              {this.renderNeedsResponseToggleButton(contact)}
              <div style={{ float: "right", marginLeft: "-30px" }}>
                {navigationToolbar}
              </div>
            </ToolbarGroup>
          </Toolbar>
        </div>
      );
    } else if (size >= 768) {
      // for needsResponse or messaged
      return (
        <div>
          <Toolbar style={inlineStyles.actionToolbarFirst}>
            <ToolbarGroup firstChild>
              <SendButton
                threeClickEnabled={false}
                onFinalTouchTap={this.handleClickSendMessageButton}
                disabled={this.props.disabled}
              />
              {this.renderNeedsResponseToggleButton(contact)}
              <RaisedButton
                label="Other responses"
                onTouchTap={this.handleOpenPopover}
              />
              <RaisedButton
                {...dataTest("optOut")}
                secondary
                label="Opt out"
                onTouchTap={this.handleOpenDialog}
                tooltip="Opt out this contact"
                tooltipPosition="top-center"
              />
              <div style={{ float: "right", marginLeft: 20 }}>
                {navigationToolbar}
              </div>
            </ToolbarGroup>
          </Toolbar>
        </div>
      );
    }
    return "";
  }

  renderTopFixedSection() {
    const { contact } = this.props;
    return (
      <ContactToolbarNew
        campaign={this.props.campaign}
        campaignContact={contact}
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
    );
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

  renderCorrectSendButton() {
    const { campaign } = this.props;
    const { contact } = this.props;
    if (
      contact.messageStatus === "messaged" ||
      contact.messageStatus === "convo" ||
      contact.messageStatus === "needsResponse"
    ) {
      return (
        <SendButtonArrow
          threeClickEnabled={false}
          onFinalTouchTap={this.handleClickSendMessageButton}
          disabled={this.props.disabled}
        />
      );
    }
    return null;
  }

  renderBottomFixedSection() {
    const { optOutDialogOpen } = this.state;
    /*
        {this.renderSurveySection()}
        <div>
          {message}
          { ? "" : this.renderActionToolbar()}
        </div>
        {
        {this.renderCannedResponsePopover()}
        {this.renderCorrectSendButton()}
    */

    return optOutDialogOpen ? (
      this.renderOptOutDialog()
    ) : (
      <div style={wrapper}></div>
    );
  }

  render() {
    console.log("AssignmentTexterContactNewControls", this.props);
    const { messageStatusFilter } = this.props;
    const { optOutDialogOpen } = this.state;
    const message = (
      <div className={css(styles.messageField)}>
        <GSForm
          ref="form"
          schema={this.messageSchema}
          value={{ messageText: this.state.messageText }}
          onSubmit={this.props.onMessageFormSubmit}
          onChange={
            messageStatusFilter === "needsMessage"
              ? ""
              : this.handleMessageFormChange
          }
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
    const wrapper = {
      display: "flex",
      flexDirection: "column",
      alignItems: "stretch",
      alignContent: "stretch"
    };
    const buttons = {
      flex: "4 1 auto", // stretches and shrinks more quickly than message
      display: "flex",
      flexWrap: "wrap",
      overflow: "hidden",
      position: "relative"
    };
    const button1 = {
      height: "30px",
      border: "1px solid black",
      padding: "3px"
    };
    const firstMessage = messageStatusFilter === "needsMessage";
    const sendButtonHeight = firstMessage ? "40%" : "36px";
    const sendButtonWrapper = {
      flex: `0 0 ${sendButtonHeight}`,
      height: sendButtonHeight,
      padding: "12px"
    };

    const sendButton = {
      width: "100%",
      height: "100%"
    };
    return (
      <div
        className={css(styles.container)}
        style={
          this.props.contact.messageStatus === "needsResponse"
            ? { backgroundColor: "rgba(83, 180, 119, 0.25)" }
            : {}
        }
      >
        <div className={css(styles.topFixedSection)}>
          {this.renderTopFixedSection()}
        </div>
        {this.renderMiddleScrollingSection()}
        {optOutDialogOpen
          ? this.renderOptOutDialog()
          : [
              message,
              firstMessage ? null : (
                <div style={buttons}>
                  Question: []
                  <div style={button1}>Question Answered</div>
                  <div style={button1}>Other Responses</div>
                  <div style={button1}>Left</div>
                  <div style={button1}>Opt-Out</div>
                  <div style={button1}>Right</div>
                  <div style={button1}>Skip</div>
                  <div style={{ position: "absolute" }}>
                    <div style={button1}>Question Answered</div>
                    <div style={button1}>Other Responses</div>
                    <div style={button1}>Left</div>
                    <div style={button1}>Skip</div>
                    <div style={button1}>Opt-Out</div>
                    <div style={button1}>Right</div>
                    <div style={button1}>Question Answered</div>
                    <div style={button1}>Other Responses</div>
                    <div style={button1}>Left</div>
                    <div style={button1}>Skip</div>
                    <div style={button1}>Opt-Out</div>
                    <div style={button1}>Right</div>
                    <div style={button1}>Question Answered</div>
                    <div style={button1}>Other Responses</div>
                    <div style={button1}>Left</div>
                    <div style={button1}>Skip</div>
                    <div style={button1}>Opt-Out</div>
                    <div style={button1}>Right</div>
                  </div>
                </div>
              ),
              <div style={sendButtonWrapper}>
                <RaisedButton
                  {...dataTest("send")}
                  onTouchTap={this.handleClickSendMessageButton}
                  disabled={this.props.disabled}
                  label={"Send"}
                  style={sendButton}
                  primary
                />
              </div>
            ]}
      </div>
    );
  }
}
/*
        <div className={css(styles.bottomFixedSection)}>
          {this.renderBottomFixedSection()}
        </div>

*/

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
