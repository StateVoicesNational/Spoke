import React, { Component } from "react";
import PropTypes from "prop-types";
import gql from "graphql-tag";
import { StyleSheet, css } from "aphrodite";
import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";

import loadData from "../../containers//hoc/load-data";
import wrapMutations from "../../containers/hoc/wrap-mutations";
import MessageResponse from "./MessageResponse";

import { dataTest } from "../../lib/attributes";
import createOptOutMutation from "../../lib/client/createOptOut";

const styles = StyleSheet.create({
  conversationRow: {
    color: "white",
    padding: "10px",
    borderRadius: "5px",
    fontWeight: "normal"
  }
});

class MessageList extends Component {
  componentDidMount() {
    if (typeof this.refs.messageWindow.scrollTo !== "function") {
      return;
    }
    this.refs.messageWindow.scrollTo(0, this.refs.messageWindow.scrollHeight);
  }

  componentDidUpdate() {
    if (typeof this.refs.messageWindow.scrollTo !== "function") {
      return;
    }
    this.refs.messageWindow.scrollTo(0, this.refs.messageWindow.scrollHeight);
  }

  render() {
    return (
      <div
        ref="messageWindow"
        style={{ maxHeight: "300px", overflowY: "scroll" }}
      >
        {this.props.messages.map((message, index) => {
          const isFromContact = message.isFromContact;
          const messageStyle = {
            marginLeft: isFromContact ? undefined : "60px",
            marginRight: isFromContact ? "60px" : undefined,
            backgroundColor: isFromContact ? "#AAAAAA" : "rgb(33, 150, 243)"
          };

          return (
            <p
              key={index}
              className={css(styles.conversationRow)}
              style={messageStyle}
            >
              {message.text}
            </p>
          );
        })}
      </div>
    );
  }
}

MessageList.propTypes = {
  messages: PropTypes.arrayOf(PropTypes.object)
};

class ConversationPreviewBody extends Component {
  constructor(props) {
    super(props);

    this.state = {
      messages: props.conversation.messages
    };

    this.messagesChanged = this.messagesChanged.bind(this);
  }

  messagesChanged(messages) {
    this.setState({ messages });
  }

  render() {
    return (
      <div>
        <MessageList messages={this.state.messages} />
        <MessageResponse
          conversation={this.props.conversation}
          messagesChanged={this.messagesChanged}
        />
      </div>
    );
  }
}

ConversationPreviewBody.propTypes = {
  conversation: PropTypes.object
};

export class _ConversationPreviewModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      optOutError: ""
    };
  }

  handleClickOptOut = async () => {
    const { cell, assignmentId, campaignContactId } = this.props.conversation;
    const optOut = {
      cell,
      assignmentId,
      reason: ""
    };
    try {
      const response = await this.props.mutations.createOptOut(
        this.props.organizationId,
        optOut,
        campaignContactId
      );
      if (response.errors) {
        let errorText = "Error processing opt-out.";
        if ("message" in response.errors) {
          errorText = response.errors.message;
        }
        console.log(errorText);
        throw new Error(errorText);
      }
      this.props.onForceRefresh();
      this.props.onRequestClose();
    } catch (error) {
      this.setState({ optOutError: error.message });
    }
  };

  render() {
    const { conversation } = this.props,
      isOpen = conversation !== undefined;

    const primaryActions = [
      <FlatButton
        {...dataTest("conversationPreviewModalOptOutButton")}
        label="Opt-Out"
        secondary={true}
        onClick={this.handleClickOptOut}
      />,
      <FlatButton
        label="Close"
        primary={true}
        onClick={this.props.onRequestClose}
      />
    ];

    return (
      <Dialog
        title="Messages"
        open={isOpen}
        actions={primaryActions}
        modal={false}
        onRequestClose={this.props.onRequestClose}
      >
        <div>
          {isOpen && <ConversationPreviewBody {...this.props} />}
          <Dialog
            title="Error Opting Out"
            open={!!this.state.optOutError}
            modal={false}
          >
            <p>{this.state.optOutError}</p>
          </Dialog>
        </div>
      </Dialog>
    );
  }
}

_ConversationPreviewModal.propTypes = {
  organizationId: PropTypes.string,
  conversation: PropTypes.object,
  onRequestClose: PropTypes.func,
  mutations: PropTypes.object,
  onForceRefresh: PropTypes.func
};

const mapMutationsToProps = () => ({
  createOptOut: createOptOutMutation
});

export default loadData(wrapMutations(_ConversationPreviewModal), {
  mapMutationsToProps
});
