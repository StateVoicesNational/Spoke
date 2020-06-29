import React, { Component } from "react";
import PropTypes from "prop-types";
import gql from "graphql-tag";
import { StyleSheet, css } from "aphrodite";
import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";
import FlagIcon from "material-ui/svg-icons/content/flag";
import Avatar from "material-ui/Avatar";
import CopyIcon from "material-ui/svg-icons/content/content-copy";
import CheckIcon from "material-ui/svg-icons/navigation/check";
import IconButton from "material-ui/IconButton/IconButton";
import TextField from "material-ui/TextField";

import theme from "../../styles/theme";

import loadData from "../../containers/hoc/load-data";
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

const TagList = props => (
  <div style={{ maxHeight: "300px", overflowY: "scroll" }}>
    {props.tags.map((tag, index) => {
      const tagStyle = {
        marginRight: "60px",
        backgroundColor: theme.colors.red,
        display: "flex",
        maxHeight: "25px",
        alignItems: "center"
      };

      const textStyle = {
        marginLeft: "10px",
        display: "flex",
        flexDirection: "column"
      };

      return (
        <p key={index} className={css(styles.conversationRow)} style={tagStyle}>
          <Avatar backgroundColor={theme.colors.red}>
            <FlagIcon color="white" />
          </Avatar>
          <p style={textStyle}>{props.organizationTags[tag.id]}</p>
        </p>
      );
    })}
  </div>
);

TagList.propTypes = {
  tags: PropTypes.arrayOf(PropTypes.object),
  organizationTags: PropTypes.object
};

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
        {window.EXPERIMENTAL_TAGS && (
          <TagList
            organizationTags={this.props.organizationTags}
            tags={this.props.conversation.tags}
          />
        )}
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
      <span>
        <IconButton
          style={{ padding: 0, height: "20px", width: "35px" }}
          iconStyle={{ height: "20px", width: "25px" }}
          onClick={this.handleCopyToClipboard}
          tooltip={
            this.state.justCopied
              ? "Copied!"
              : "Copy conversation link to clipboard"
          }
          tooltipPosition="top-right"
        >
          {this.state.justCopied ? (
            <CheckIcon color={theme.colors.green} />
          ) : (
            <CopyIcon />
          )}
        </IconButton>
        <TextField
          ref="convoLink"
          value={url}
          underlineShow={false}
          inputStyle={{ visibility: "visible", height: "1px", width: "1px" }}
          style={{ width: "1px", height: "1px" }}
          onFocus={event => event.target.select()}
        />
        <a href={url} target="_blank">
          GO TO CONVERSATION
        </a>
      </span>,
      <FlatButton
        {...dataTest("conversationPreviewModalOptOutButton")}
        label="Opt-Out"
        secondary
        onClick={this.handleClickOptOut}
      />,
      <FlatButton label="Close" primary onClick={this.props.onRequestClose} />
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

export default loadData({ mutations })(InnerConversationPreviewModal);
