import PropTypes from "prop-types";
import React from "react";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
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

    const { currentContact } = this.props;

    this.state = {
      search: "",
      messageStatus: currentContact.messageStatus
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

  renderContacts = () => {
    const { contacts, updateCurrentContactById, currentContact } = this.props;

    console.log('AssignmentContactsList', this.props);

    // Filter contacts by message status and search
    const filteredContacts = contacts.filter(
      c =>
        `${c.firstName} ${c.lastName}`
          .toLowerCase()
          .includes(this.state.search.toLowerCase()) &&
        c.messageStatus === this.state.messageStatus
    );

    return filteredContacts.map(contact => (
      <ListItem
        key={contact.id}
        id={this.getContactListItemId(contact.id)}
        selected={contact.id === currentContact.id}
        onClick={() => updateCurrentContactById(contact.id)}
        button
      >
        <ListItemText
          primary={`${contact.firstName} ${contact.lastName}`}
        />
        <ListItemSecondaryAction>
          <span style={inlineStyles.updatedAt}>
            {moment.utc(contact.updated_at).fromNow()}
          </span>
        </ListItemSecondaryAction>
      </ListItem>
    ));
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
        <Tabs
          value={this.state.messageStatus}
          onChange={(ev, messageStatus) => this.setState({ messageStatus })}
          indicatorColor="primary"
          variant="scrollable"
          scrollButtons="on"
        >
          <Tab label="Respond" value="needsResponse" />
          <Tab label="Past" value="convo" />
          <Tab label="Skipped" value="closed" />
        </Tabs>
        <SearchBar
          onChange={search => this.setState({ search: search || "" })}
          onCancelSearch={() => this.setState({ search: "" })}
          onRequestSearch={() => undefined}
          value={this.state.search}
          style={inlineStyles.contactsListSearch}
        />
        <List
          id="assignment-contacts-list"
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