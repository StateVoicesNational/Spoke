import PropTypes from "prop-types";
import React from "react";
import { Link as RouterLink } from "react-router";
import moment from "moment";
import { compose } from "recompose";

import HeadsetIcon from "@material-ui/icons/Headset";
import ImageIcon from "@material-ui/icons/Image";
import TvIcon from "@material-ui/icons/Tv";
import AttachmentIcon from "@material-ui/icons/Attachment";
import NotInterestedIcon from "@material-ui/icons/NotInterested";
import Divider from "@material-ui/core/Divider";
import Avatar from "@material-ui/core/Avatar";
import Card from "@material-ui/core/Card";
import CardHeader from "@material-ui/core/CardHeader";
import CardMedia from "@material-ui/core/CardMedia";
import Collapse from "@material-ui/core/Collapse";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemIcon from "@material-ui/core/ListItemIcon";

import withMuiTheme from "../../containers/hoc/withMuiTheme";

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
        <RouterLink
          target="_blank"
          to={`/app/${organizationId}/account/${message.userId}`}
        >
          User {message.userId}
        </RouterLink>
      </span>
    );
  }

  return (
    <span style={{ fontSize: "90%", display: "block", paddingTop: "5px" }}>
      {moment.utc(message.createdAt).fromNow()}
    </span>
  );
}

export class MessageList extends React.Component {
  state = {
    expanded: false
  };

  optOutItem = optOut =>
    !optOut ? null : (
      <div>
        <Divider />
        <ListItem style={defaultStyles.optOut} key={"optout-item"}>
          <ListItemIcon>
            <NotInterestedIcon color="error" />
          </ListItemIcon>
          <ListItemText
            primary={`${this.props.contact.firstName} opted out of texts`}
            secondary={moment(optOut.createdAt).fromNow()}
          />
        </ListItem>
      </div>
    );

  renderMsg(message) {
    const { hideMedia } = this.props;
    return (
      <div key={message.id || message.text}>
        <div>{message.text}</div>
        {!hideMedia &&
          message.media &&
          message.media.map(media => {
            let type, icon, embed, subtitle;
            if (media.type.startsWith("image")) {
              type = "Image";
              icon = <ImageIcon />;
              embed = <img src={media.url} alt="Media" />;
            } else if (media.type.startsWith("video")) {
              type = "Video";
              icon = <TvIcon />;
              embed = (
                <video controls>
                  <source src={media.url} type={media.type} />
                  Your browser can&rsquo;t play this file
                </video>
              );
            } else if (media.type.startsWith("audio")) {
              type = "Audio";
              icon = <HeadsetIcon />;
              embed = (
                <audio controls>
                  <source src={media.url} type={media.type} />
                  Your browser can&rsquo;t play this file
                </audio>
              );
            } else {
              type = "Unsupprted media";
              icon = <AttachmentIcon />;
              subtitle = `Type: ${media.type}`;
            }
            return (
              <Card style={defaultStyles.mediaItem} key={`media${media.url}`}>
                <CardHeader
                  title={`${type} attached`}
                  subtitle={subtitle || "View media at your own risk"}
                  avatar={<Avatar>{icon}</Avatar>}
                  onClick={() => {
                    this.setState({ expanded: !this.state.expanded });
                  }}
                />
                <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                  {embed && <CardMedia>{embed}</CardMedia>}
                </Collapse>
              </Card>
            );
          })}
      </div>
    );
  }

  render() {
    const {
      contact,
      styles,
      review,
      currentUser,
      organizationId,
      muiTheme
    } = this.props;
    let received = defaultStyles.received;
    let sent = defaultStyles.sent;
    if (styles) {
      received = Object.assign({}, styles.messageReceived, {
        color: muiTheme.palette.common.white,
        backgroundColor: muiTheme.palette.info.main
      });
      sent = Object.assign({}, styles.messageSent, {
        color: muiTheme.palette.text.primary,
        backgroundColor: muiTheme.palette.background.default
      });
    }

    const listStyle = (styles && styles.messageList) || {};
    const { optOut, messages } = contact;

    return (
      <List style={listStyle}>
        {messages.map(message => (
          <ListItem
            style={message.isFromContact ? received : sent}
            key={message.id}
            primary={this.renderMsg(message)}
            secondary={
              <SecondaryText
                message={message}
                review={review}
                currentUser={currentUser}
                organizationId={organizationId}
              />
            }
          >
            <ListItemText
              primary={this.renderMsg(message)}
              secondary={
                <SecondaryText
                  message={message}
                  review={review}
                  currentUser={currentUser}
                  organizationId={organizationId}
                />
              }
            />
          </ListItem>
        ))}
        {this.optOutItem(optOut)}
      </List>
    );
  }
}

MessageList.propTypes = {
  contact: PropTypes.object,
  currentUser: PropTypes.object,
  organizationId: PropTypes.string,
  review: PropTypes.string,
  styles: PropTypes.object,
  hideMedia: PropTypes.bool
};

export default compose(withMuiTheme)(MessageList);
