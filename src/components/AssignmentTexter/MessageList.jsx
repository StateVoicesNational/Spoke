import PropTypes from "prop-types";
import React from "react";
import { Link } from "react-router";
import { List, ListItem } from "material-ui/List";
import moment from "moment";
import ProhibitedIcon from "material-ui/svg-icons/av/not-interested";
import Divider from "material-ui/Divider";
import { red300 } from "material-ui/styles/colors";

const defaultStyles = {
  optOut: {
    fontSize: "13px",
    fontStyle: "italic"
  },
  sent: {
    fontSize: "13px",
    textAlign: "right",
    marginLeft: "24px"
  },
  received: {
    fontSize: "13px",
    marginRight: "24px"
  }
};

function SecondaryText(props) {
  const { message, review, currentUser, organizationId } = props;

  // Add link to account info page for sender if currentUser is an admin in
  // "review mode" (as indicated by URL param)
  if (
    review === "1" &&
    currentUser.roles.includes("ADMIN") &&
    !message.isFromContact
  ) {
    return (
      <span style={{ fontSize: "90%", display: "block", paddingTop: "5px" }}>
        Sent {moment.utc(message.createdAt).fromNow()} by{" "}
        <Link
          target="_blank"
          to={`/app/${organizationId}/account/${message.userId}`}
        >
          User {message.userId}
        </Link>
      </span>
    );
  }

  return (
    <span style={{ fontSize: "90%", display: "block", paddingTop: "5px" }}>
      {moment.utc(message.createdAt).fromNow()}
    </span>
  );
}

const MessageList = function MessageList(props) {
  const { contact, styles, review, currentUser, organizationId } = props;
  const { optOut, messages } = contact;

  const received = (styles && styles.messageReceived) || defaultStyles.received;
  const sent = (styles && styles.messageSent) || defaultStyles.sent;
  const listStyle = (styles && styles.messageList) || {};

  const optOutItem = optOut ? (
    <div>
      <Divider />
      <ListItem
        disabled
        style={defaultStyles.optOut}
        key={"optout-item"}
        leftIcon={<ProhibitedIcon style={{ fill: red300 }} />}
        primaryText={`${contact.firstName} opted out of texts`}
        secondaryText={moment(optOut.createdAt).fromNow()}
      />
    </div>
  ) : (
    ""
  );

  return (
    <List style={listStyle}>
      {messages.map(message => (
        <ListItem
          disabled
          style={message.isFromContact ? received : sent}
          key={message.id}
          primaryText={message.text}
          secondaryText={
            <SecondaryText
              message={message}
              review={review}
              currentUser={currentUser}
              organizationId={organizationId}
            />
          }
        />
      ))}
      {optOutItem}
    </List>
  );
};

MessageList.propTypes = {
  contact: PropTypes.object,
  currentUser: PropTypes.object,
  organizationId: PropTypes.string,
  review: PropTypes.string,
  styles: PropTypes.object
};

export default MessageList;
