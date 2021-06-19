import React, { Component } from "react";
import PropTypes from "prop-types";
import gql from "graphql-tag";
import { compose } from "recompose";
import { StyleSheet, css } from "aphrodite";

import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogActions from "@material-ui/core/DialogActions";
import IconButton from "@material-ui/core/IconButton";
import Tooltip from "@material-ui/core/Tooltip";
import FileCopyIcon from "@material-ui/icons/FileCopy";
import CheckIcon from "@material-ui/icons/Check";

import loadData from "../../containers/hoc/load-data";
import MessageResponse from "./MessageResponse";

import { dataTest } from "../../lib/attributes";
import withMuiTheme from "../../containers/hoc/withMuiTheme";
import TagList from "./TagList";

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

  UNSAFE_componentWillReceiveProps() {
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
        <TagList
          organizationTags={this.props.organizationTags}
          tags={this.props.conversation.tags}
        />
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
  conversation: PropTypes.object,
  organizationTags: PropTypes.object
};

export class InnerConversationPreviewModal extends Component {
  constructor(props) {
    super(props);

    this.handleCopyToClipboard = this.handleCopyToClipboard.bind(this);

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
        console.log(errorText); // eslint-disable-line no-console
        throw new Error(errorText);
      }
      this.props.onForceRefresh();
      this.props.onRequestClose();
    } catch (error) {
      this.setState({ optOutError: error.message });
    }
  };

  handleCopyToClipboard = () => {
    this.refs.convoLink.focus();
    document.execCommand("copy");
    this.setState({ justCopied: true });
    setTimeout(() => {
      this.setState({ justCopied: false });
    }, 2000);
  };

  render() {
    const { conversation, organizationId } = this.props;
    const isOpen = conversation !== undefined;

    const { host, protocol } = document.location;
    const { assignmentId, campaignContactId } = conversation || {};
    const url = `${protocol}//${host}/app/${organizationId}/todos/review/${campaignContactId}`;

    const primaryActions = [
      <span key="1">
        <Tooltip
          title={
            this.state.justCopied
              ? "Copied!"
              : "Copy conversation link to clipboard"
          }
          placement="left"
        >
          <IconButton onClick={this.handleCopyToClipboard}>
            {this.state.justCopied ? (
              <CheckIcon
                style={{ color: this.props.muiTheme.palette.success.main }}
              />
            ) : (
              <FileCopyIcon />
            )}
          </IconButton>
        </Tooltip>
        <input
          type="text"
          ref="convoLink"
          defaultValue={url}
          onFocus={event => event.target.select()}
          style={{ width: "1px", height: "1px", border: 0, padding: 0 }}
        />
        <a href={url} target="_blank">
          GO TO CONVERSATION
        </a>
      </span>,
      <Button
        key="2"
        {...dataTest("conversationPreviewModalOptOutButton")}
        label="Opt-Out"
        color="secondary"
        onClick={this.handleClickOptOut}
      >
        Opt-Out
      </Button>,
      <Button key="3" color="primary" onClick={this.props.onRequestClose}>
        Close
      </Button>
    ];

    return (
      <Dialog
        fullWidth={true}
        maxWidth="md"
        open={isOpen}
        onClose={this.props.onRequestClose}
      >
        <DialogTitle>Messages</DialogTitle>
        <div style={{ padding: 10 }}>
          {isOpen && <ConversationPreviewBody {...this.props} />}
          <Dialog
            title="Error Opting Out"
            open={!!this.state.optOutError}
            modal={false}
          >
            <p>{this.state.optOutError}</p>
          </Dialog>
        </div>
        <DialogActions>{primaryActions}</DialogActions>
      </Dialog>
    );
  }
}

InnerConversationPreviewModal.propTypes = {
  organizationTags: PropTypes.object,
  organizationId: PropTypes.string,
  conversation: PropTypes.object,
  onRequestClose: PropTypes.func,
  mutations: PropTypes.object,
  onForceRefresh: PropTypes.func
};

export const createOptOutGql = gql`
  mutation createOptOut($optOut: OptOutInput!, $campaignContactId: String!) {
    createOptOut(optOut: $optOut, campaignContactId: $campaignContactId) {
      id
    }
  }
`;

const mutations = {
  createOptOut: () => (optOut, campaignContactId) => ({
    mutation: createOptOutGql,
    variables: {
      optOut,
      campaignContactId
    }
  })
};

export default compose(
  withMuiTheme,
  loadData({ mutations })
)(InnerConversationPreviewModal);
