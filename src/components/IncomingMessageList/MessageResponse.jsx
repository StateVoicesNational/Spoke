import React, { Component } from "react";
import PropTypes from "prop-types";
import Form from "react-formal";
import * as yup from "yup";
import gql from "graphql-tag";
import { StyleSheet, css } from "aphrodite";

import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogActions from "@material-ui/core/DialogActions";

import loadData from "../../containers/hoc/load-data";
import GSForm from "../../components/forms/GSForm";
import GSTextField from "../../components/forms/GSTextField";
import SendButton from "../../components/SendButton";

const styles = StyleSheet.create({
  messageField: {
    padding: "0px 8px"
  }
});

class MessageResponse extends Component {
  constructor(props) {
    super(props);
    this.formRef = React.createRef();

    this.state = {
      messageText: "",
      isSending: false,
      sendError: "",
      doneFirstClick: false
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
    if (this.state.isSending) {
      return; // stops from multi-send
    }

    if (window.TEXTER_TWOCLICK && !this.state.doneFirstClick) {
      this.setState({ doneFirstClick: true }); // Enforce TEXTER_TWOCLICK
      return;
    }

    const { campaignContactId } = this.props.conversation;
    const message = this.createMessageToContact(messageText);

    this.setState({ isSending: true });

    const finalState = { isSending: false, doneFirstClick: false };
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
    this.formRef.current.submit();
  };

  render() {
    const messageSchema = yup.object({
      messageText: yup
        .string()
        .required("Can't send empty message")
        .max(window.MAX_MESSAGE_LENGTH)
    });

    const { messageText, isSending, doneFirstClick } = this.state;
    const isSendDisabled = isSending || messageText.trim() === "";

    return (
      <div className={css(styles.messageField)}>
        <GSForm
          setRef={this.formRef}
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
                width: "170px"
              }}
            >
              <SendButton
                onClick={this.handleClickSendMessageButton}
                disabled={isSendDisabled}
                doneFirstClick={doneFirstClick}
              />
            </div>
            <div style={{ marginRight: "170px" }}>
              <Form.Field
                as={GSTextField}
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
        <Dialog open={!!this.state.sendError}>
          <DialogTitle>Error Sending</DialogTitle>
          <p>{this.state.sendError}</p>
          <DialogActions>
            <Button color="primary" onClick={this.handleCloseErrorDialog}>
              OK
            </Button>
          </DialogActions>
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
