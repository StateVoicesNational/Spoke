import PropTypes from "prop-types";
import React from "react";
import List from "@material-ui/core/List";
import ListSubheader from '@material-ui/core/ListSubheader';
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import Divider from '@material-ui/core/Divider';
import SearchBar from "material-ui-search-bar";
import moment from "moment";

const inlineStyles = {
  contactsListParent: {
    display: "flex",
    flexDirection: "column",
    maxHeight: "100%"
  },
  contactListScrollContainer: {
    overflow: "hidden scroll"
  },
  contactsListSearch: {
    marginTop: 10,
    minHeight: 48
  },
  updatedAt: {
    fontSize: 12,
    width: "auto",
    top: "auto",
    margin: "0 4px"
  }
};

const momentConfigShort = {
  future: "%s",
  past: "%s",
  s: "%ds",
  ss: "%ds",
  m: "%dm",
  mm: "%dm",
  h: "%dh",
  hh: "%dh",
  d: "%dd",
  dd: "%dd",
  w: "%dw",
  ww: "%dw",
  M: "%dmo",
  MM: "%dmo",
  y: "%dy",
  yy: "%dy"
};

class AssignmentContactsList extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      search: "",
      messageStatus: null
    };
  }

  getContactListItemId(id) {
    return `switch-to-contact-id-${id}`;
  }

  componentDidMount() {
    const { currentContact } = this.props;

    const node = document.getElementById(
      this.getContactListItemId(currentContact.id)
    );

    // Scroll the list item element to center if possible, so it's always displayed in the sidebar
    if (node) {
      const isSafari = /^((?!chrome|android).)*safari/i.test(
        navigator.userAgent
      );

      if (node.scrollIntoView) {
        if (isSafari) {
          node.scrollIntoView();
        } else {
          node.scrollIntoView({
            block: "center"
          });
        }
      } else {
        document.getElementById("assignment-contacts-list").scrollTop =
          node.offsetTop - 300;
      }
    }
  }

  renderContact = contact => {
    const { updateCurrentContactById, currentContact } = this.props;

    const props = contact.messageStatus === "closed"
      ? { secondary: `${contact.firstName} ${contact.lastName}` }
      : { primary: `${contact.firstName} ${contact.lastName}` };

    return (
      <ListItem 
        key={contact.id}
        id={this.getContactListItemId(contact.id)}
        selected={contact.id === currentContact.id}
        onClick={() => updateCurrentContactById(contact.id)}
        button
      >
        {contact.messageStatus === "needsResponse" ? (
          <ListItemIcon><FiberManualRecordIcon color="primary" /></ListItemIcon>
        ): ""}
        <ListItemText
          inset={contact.messageStatus !== "needsResponse"}
          {...props}
        />
        <ListItemSecondaryAction>
          <span style={inlineStyles.updatedAt}>
            {moment.utc(contact.updated_at).fromNow()}
          </span>
        </ListItemSecondaryAction>
      </ListItem>
    );
  };

  renderContacts = () => {
    // Filter contacts by message status and search
    const filteredContacts = this.props.contacts.filter(
      c =>
        `${c.firstName} ${c.lastName}`
          .toLowerCase()
          .includes(this.state.search.toLowerCase()) &&
        (!this.state.messageStatus || c.messageStatus === this.state.messageStatus)
    );

    const backgroundColor = "rgb(214, 215, 223)";

    return [
      <ListSubheader key="needsResponse-subheader" style={{ backgroundColor }}>Respond</ListSubheader>,
      filteredContacts.filter(c => c.messageStatus === "needsResponse").map(this.renderContact),
      <Divider key="needsResponse-divider" />,
      <ListSubheader key="convo-subheader" style={{ backgroundColor }}>Past</ListSubheader>,
      filteredContacts.filter(c => c.messageStatus === "convo").map(this.renderContact),
      <Divider key="convo-divider" />,
      <ListSubheader key="closed-subheader" style={{ backgroundColor }}>Skipped</ListSubheader>,
      filteredContacts.filter(c => c.messageStatus === "closed").map(this.renderContact)
    ];
  };

  render() {
    const momentConfigOrig = moment()
      .locale("en")
      .localeData()._relativeTime;

    // Hack around fromNow formatting. We want to keep formatting short only here, so we have to revert back after rendering.
    moment.updateLocale("en", { relativeTime: momentConfigShort });

    const contactList = this.renderContacts();

    moment.updateLocale("en", { relativeTime: momentConfigOrig });

    return (
      <div style={inlineStyles.contactsListParent}>
        <SearchBar
          onChange={search => this.setState({ search: search || "" })}
          onCancelSearch={() => this.setState({ search: "" })}
          onRequestSearch={() => undefined}
          value={this.state.search}
          style={inlineStyles.contactsListSearch}
        />
        <List
          id="assignment-contacts-list"
          subheader={<ListSubheader />}
          style={inlineStyles.contactListScrollContainer}
        >
          {contactList}
        </List>
      </div>
    );
  }
}

AssignmentContactsList.propTypes = {
  contacts: PropTypes.arrayOf(PropTypes.object),
  currentContact: PropTypes.object,
  updateCurrentContactById: PropTypes.func
};

export default AssignmentContactsList;