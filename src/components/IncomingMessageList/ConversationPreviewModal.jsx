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

export class InnerConversationPreviewModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      optOutError: ""
    };
  }

  handleClickOptOut = async () => {
    const { assignmentId, cell, campaignContactId } = this.props.conversation;

    const optOut = {
      cell,
      assignmentId
    };

    try {
      const response = await this.props.mutations.createOptOut(
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

InnerConversationPreviewModal.propTypes = {
  conversation: PropTypes.object,
  onRequestClose: PropTypes.func,
  mutations: PropTypes.object,
  onForceRefresh: PropTypes.func
};

export const createOptOutGqlString = `mutation createOptOut(
  $optOut: OptOutInput!
  $campaignContactId: String!
) {
  createOptOut(
   optOut: $optOut
   campaignContactId: $campaignContactId
  ) {
   id
  }
}`;

export const createOptOutGql = gql`
  ${createOptOutGqlString}
`;

const mapMutationsToProps = () => ({
  createOptOut: (optOut, campaignContactId) => ({
    mutation: createOptOutGql,
    variables: {
      optOut,
      campaignContactId
    }
  })
});

export default loadData(wrapMutations(InnerConversationPreviewModal), {
  mapMutationsToProps
});
