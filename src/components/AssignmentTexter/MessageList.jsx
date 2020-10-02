import PropTypes from "prop-types";
import React from "react";
import { List, ListItem } from "material-ui/List";
import { Card, CardHeader, CardMedia } from "material-ui/Card";
import Avatar from "material-ui/Avatar";
import moment from "moment";
import AttachmentIcon from "material-ui/svg-icons/file/attachment";
import AudioIcon from "material-ui/svg-icons/hardware/headset";
import ImageIcon from "material-ui/svg-icons/image/image";
import VideoIcon from "material-ui/svg-icons/hardware/tv";
import ProhibitedIcon from "material-ui/svg-icons/av/not-interested";
import Divider from "material-ui/Divider";
import { red300 } from "material-ui/styles/colors";
import theme from "../../styles/theme";

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
  },
  mediaItem: {
    marginTop: "5px",
    backgroundColor: "rgba(255,255,255,.5)"
  }
};

const MessageList = function MessageList(props) {
  const { contact, styles } = props;
  const { optOut, messages } = contact;

  messages.forEach(m => {
    console.log(m);
  });

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

  const renderMsg = message => (
    <div>
      <div>{message.text}</div>
      {message.media && message.media.map(media => {
        let type, icon, embed, subtitle;
        if (media.type.startsWith('image')) {
          type = 'Image';
          icon = <ImageIcon />;
          embed = <img src={media.url} alt="Media" />;
        }
        else if (media.type.startsWith('video')) {
          type = 'Video';
          icon = <VideoIcon />;
          embed = (
            <video controls>
              <source src={media.url} type={media.type} />
              Your browser can't play this file
            </video>
          );
        }
        else if (media.type.startsWith('audio')) {
          type = 'Audio';
          icon = <AudioIcon />;
          embed = (
            <audio controls>
              <source src={media.url} type={media.type} />
              Your browser can't play this file
            </audio>
          );
        }
        else {
          type = 'Unsupprted media';
          icon = <AttachmentIcon />;
          subtitle = `Type: ${media.type}`;
        }
        return (
          <Card style={defaultStyles.mediaItem}>
            <CardHeader
              actAsExpander
              showExpandableButton={!!embed}
              title={`${type} attached`}
              subtitle={subtitle || "View media at your own risk"}
              avatar={<Avatar
                icon={icon}
                backgroundColor={theme.colors.darkGray}
              />}
            />
            {embed && (
              <CardMedia expandable>
                {embed}
              </CardMedia>
            )}
          </Card>
        )
      })}
    </div>
  );

  return (
    <List style={listStyle}>
      {messages.map(message => (
        <ListItem
          disabled
          style={message.isFromContact ? received : sent}
          key={message.id}
          primaryText={renderMsg(message)}
          secondaryText={
            <span
              style={{ fontSize: "90%", display: "block", paddingTop: "5px" }}
            >
              {moment.utc(message.createdAt).fromNow()}
            </span>
          }
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
