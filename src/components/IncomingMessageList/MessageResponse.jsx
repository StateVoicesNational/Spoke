import React, { Component } from "react";
import PropTypes from "prop-types";
import Form from "react-formal";
import yup from "yup";
import gql from "graphql-tag";
import { StyleSheet, css } from "aphrodite";
import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";

import loadData from "../../containers/hoc/load-data";
import GSForm from "../../components/forms/GSForm";
import SendButton from "../../components/SendButton";

const styles = StyleSheet.create({
  messageField: {
    padding: "0px 8px"
  }
});

class MessageResponse extends Component {
  constructor(props) {
    super(props);

    this.state = {
      messageText: "",
      isSending: false,
      sendError: ""
    };

    this.handleCloseErrorDialog = this.handleCloseErrorDialog.bind(this);
  }

  createMessageToContact(text) {
    const { cell, assignmentId } = this.props.conversation;

    return {
      assignmentId: assignmentId,
      contactNumber: cell,
      text
    };
  }

  handleMessageFormChange = ({ messageText }) => this.setState({ messageText });

  handleMessageFormSubmit = async ({ messageText }) => {
    const { campaignContactId } = this.props.conversation;
    const message = this.createMessageToContact(messageText);
    if (this.state.isSending) {
      return; // stops from multi-send
    }
    this.setState({ isSending: true });

    const finalState = { isSending: false };
    try {
      const response = await this.props.mutations.sendMessage(
        message,
        campaignContactId
      );
      const { messages } = response.data.sendMessage;
      this.props.messagesChanged(messages);
      finalState.messageText = "";
    } catch (e) {
      finalState.sendError = e.message;
    }

    this.setState(finalState);
  };

  handleCloseErrorDialog() {
    this.setState({ sendError: "" });
  }

  handleClickSendMessageButton = () => {
    this.refs.messageForm.submit();
  };

  render() {
    const messageSchema = yup.object({
      messageText: yup
        .string()
        .required("Can't send empty message")
        .max(window.MAX_MESSAGE_LENGTH)
    });

    const { messageText, isSending } = this.state;
    const isSendDisabled = isSending || messageText.trim() === "";

    const errorActions = [
      <FlatButton
        label="OK"
        primary={true}
        onClick={this.handleCloseErrorDialog}
      />
    ];

    return (
      <div className={css(styles.messageField)}>
        <GSForm
          ref="messageForm"
          schema={messageSchema}
          value={{ messageText: this.state.messageText }}
          onSubmit={this.handleMessageFormSubmit}
          onChange={this.handleMessageFormChange}
        >
          <div style={{ position: "relative" }}>
            <div
              style={{
                position: "absolute",
                right: 0,
                bottom: 0,
                width: "120px"
              }}
            >
              <SendButton
                onFinalTouchTap={this.handleClickSendMessageButton}
                disabled={isSendDisabled}
              />
            </div>
            <div style={{ marginRight: "120px" }}>
              <Form.Field
                name="messageText"
                label="Send a response"
                multiLine
                fullWidth
                disabled={isSending}
                rowsMax={6}
              />
            </div>
          </div>
        </GSForm>
        <Dialog
          title="Error Sending"
          open={!!this.state.sendError}
          actions={errorActions}
          modal={false}
        >
          <p>{this.state.sendError}</p>
        </Dialog>
      </div>
    );
  }
}

MessageResponse.propTypes = {
  conversation: PropTypes.object,
  messagesChanged: PropTypes.func
};

const mutations = {
  sendMessage: ownProps => (message, campaignContactId) => ({
    mutation: gql`
      mutation sendMessage(
        $message: MessageInput!
        $campaignContactId: String!
      ) {
        sendMessage(message: $message, campaignContactId: $campaignContactId) {
          id
          messageStatus
          messages {
            id
            createdAt
            text
            isFromContact
          }
        }
      }
    `,
    variables: {
      message,
      campaignContactId
    }
  })
};

export default loadData({ mutations })(MessageResponse);
