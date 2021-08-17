import PropTypes from "prop-types";
import React from "react";
import List from "@material-ui/core/List";
import ListSubheader from '@material-ui/core/ListSubheader';
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import Link from "@material-ui/core/Link";
import Divider from '@material-ui/core/Divider';
import Chip from '@material-ui/core/Chip';
import SmsIcon from "@material-ui/icons/Sms";
import CheckIcon from "@material-ui/icons/Check";
import BlockIcon from "@material-ui/icons/Block";
import SearchBar from "material-ui-search-bar";
import moment from "moment";

const inlineStyles = {
  contactsListParent: {
    display: "flex",
    flexDirection: "column",
    maxHeight: "100%"
  },
  contactListScrollContainer: {
    overflow: "hidden scroll",
    borderRight: "1px solid #C1C3CC",
  },
  contactsListSearch: {
    height: 32
  },
  updatedAt: {
    fontSize: 12,
    width: "auto",
    top: "auto",
    margin: "0 4px"
  },
  searchBar: {
    backgroundColor: "rgba(126, 128, 139, .7)",
    padding: 12
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
      limit: 100,
      showNeedsResponse: true,
      showConvo: true,
      showClosed: true
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

    return (
      <ListItem 
        key={contact.id}
        id={this.getContactListItemId(contact.id)}
        selected={contact.id === currentContact.id}
        onClick={() => updateCurrentContactById(contact.id)}
        button
      >
        <ListItemText
          primary={`${contact.firstName} ${contact.lastName}`}
          primaryTypographyProps={{
            color: contact.messageStatus === "closed" ? 'textSecondary' : 'textPrimary',
            style: {
              fontWeight: contact.messageStatus === "needsResponse" ? 600 : undefined,
              fontStyle: contact.messageStatus === "closed" ? "italic" : undefined
            }
          }}
        />
        <ListItemSecondaryAction>
          <span style={inlineStyles.updatedAt}>
            {moment.utc(contact.updated_at).fromNow()}
          </span>
        </ListItemSecondaryAction>
      </ListItem>
    );
  };

  // Prevent refreshes on any updates in the controls, since they shouldn't change what's in here.
  // shouldComponentUpdate = () => false

  matchesStatuses = contact => {
    switch (contact.messageStatus) {
      case "needsResponse":
        return this.state.showNeedsResponse;
      case "convo":
        return this.state.showConvo;
      case "closed":
        return this.state.showClosed;
      default:
        return false;
    }
  }

  renderContacts = (contacts) => {
    // Filter contacts by message status and search
    const filteredContacts = contacts.filter(
      c =>
        `${c.firstName} ${c.lastName}`
          .toLowerCase()
          .includes(this.state.search.toLowerCase()) &&
        this.matchesStatuses(c)
    );

    const contactsToDisplay = filteredContacts.slice(0, this.state.limit);

    return (
      <List
        id="assignment-contacts-list"
        subheader={<ListSubheader />}
        style={inlineStyles.contactListScrollContainer}
      >
        {contactsToDisplay.map(c => this.renderContact(c))}
        {this.state.limit <= filteredContacts.length && (
          <ListItem
            key="SeeMoreLink"
            onClick={() => this.setState({limit: this.state.limit + 100})}
            button
          >
            <ListItemText
              primary="See more"
              primaryTypographyProps={{
                color: 'primary'
              }}
            />
          </ListItem>
        )}
      </List>
    );
  };

  render() {
    console.log('rendering ACL')
    const momentConfigOrig = moment()
      .locale("en")
      .localeData()._relativeTime;

    // Hack around fromNow formatting. We want to keep formatting short only here, so we have to revert back after rendering.
    moment.updateLocale("en", { relativeTime: momentConfigShort });

    const contactList = this.renderContacts(this.props.contacts);

    moment.updateLocale("en", { relativeTime: momentConfigOrig });

    console.log(this.props.contacts);
    const counts = this.props.contacts.reduce((cts, c) => {
      if (!cts[c.messageStatus]) { cts[c.messageStatus] = 1; }
      else { cts[c.messageStatus] += 1; }
      return cts;
    }, {});

    console.log(counts)

    return (
      <div style={inlineStyles.contactsListParent}>
        <div style={inlineStyles.searchBar}>
          <SearchBar
            onChange={search => this.setState({ search: search || "" })}
            onCancelSearch={() => this.setState({ search: "" })}
            onRequestSearch={() => undefined}
            value={this.state.search}
            style={inlineStyles.contactsListSearch}
            placeholder="Search Contacts"
          />
        </div>
        <div style={{padding: 12}}>
          <Chip
            label={`Respond (${counts["needsResponse"]})`}
            color="primary"
            size="small"
            variant={this.state.showNeedsResponse ? "default" : "outlined"}
            onClick={() => this.setState({ showNeedsResponse: !this.state.showNeedsResponse })}
            clickable
          />
          <Chip
            label={`Past (${counts["convo"]})`}
            color="primary"
            size="small"
            variant={this.state.showConvo ? "default" : "outlined"}
            onClick={() => this.setState({ showConvo: !this.state.showConvo })}
            clickable
            style={{margin: "0 6px"}}
          />
          <Chip
            label={`Skipped (${counts["closed"]})`}
            color="primary"
            variant={this.state.showClosed ? "default" : "outlined"}
            onClick={() => this.setState({ showClosed: !this.state.showClosed })}
            size="small"
            clickable
          />
        </div>
        {contactList}
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