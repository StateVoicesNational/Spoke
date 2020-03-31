import PropTypes from "prop-types";
import React from "react";
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

const MessageList = function MessageList(props) {
  const { contact, styles } = props;
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
          secondaryText={moment.utc(message.createdAt).fromNow()}
        />
      ))}
      {optOutItem}
    </List>
  );
};

MessageList.propTypes = {
  contact: PropTypes.object,
  styles: PropTypes.object
};

export default MessageList;
