import PropTypes from "prop-types";
import React from "react";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import MenuItem from "@material-ui/core/MenuItem";
import SearchBar from "material-ui-search-bar";
import moment from "moment";
import IconButton from "@material-ui/core/IconButton";
import FilterListIcon from "@material-ui/icons/FilterList";
import { Menu } from "@material-ui/core";

const inlineStyles = {
  contactsListParent: {
    display: "flex",
    flexDirection: "column",
    height: "100%"
  },
  contactsListFilters: {
    margin: 12,
    borderRight: "1px solid #C1C3CC",
    width: "calc(100% - 24px)"
  },
  contactListScrollContainer: {
    overflow: "hidden scroll",
    borderRight: "1px solid #C1C3CC",
    height: "100%"
  },
  contactsListSearch: {
    height: 32,
    margin: "12px 0 12px 12px"
  },
  updatedAt: {
    fontSize: 12,
    width: "auto",
    top: "auto",
    margin: "0 4px"
  },
  searchBar: {
    display: "flex",
    backgroundColor: "rgba(126, 128, 139, .7)"
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
      filterEl: null,
      statuses: ["needsResponse", "convo", "closed"]
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

  openFilterMenu = e => this.setState({ filterEl: e.currentTarget });
  closeMenu = () => this.setState({ filterEl: null });

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
            color:
              contact.messageStatus === "closed"
                ? "textSecondary"
                : "textPrimary",
            style: {
              fontWeight:
                contact.messageStatus === "needsResponse" ? 600 : undefined,
              fontStyle:
                contact.messageStatus === "closed" ? "italic" : undefined
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

  renderContacts = contacts => {
    // Filter contacts by message status and search
    const filteredContacts = contacts.filter(
      c =>
        `${c.firstName} ${c.lastName}`
          .toLowerCase()
          .includes(this.state.search.toLowerCase()) &&
        this.state.statuses.indexOf(c.messageStatus) > -1
    );

    const contactsToDisplay = filteredContacts.slice(0, this.state.limit);

    return (
      <List
        id="assignment-contacts-list"
        style={inlineStyles.contactListScrollContainer}
      >
        {contactsToDisplay.map(c => this.renderContact(c))}
        {this.state.limit <= filteredContacts.length && (
          <ListItem
            key="SeeMoreLink"
            onClick={() => this.setState({ limit: this.state.limit + 100 })}
            button
          >
            <ListItemText
              primary="See more"
              primaryTypographyProps={{
                color: "primary"
              }}
            />
          </ListItem>
        )}
      </List>
    );
  };

  render() {
    console.log("rendering ACL");
    const momentConfigOrig = moment()
      .locale("en")
      .localeData()._relativeTime;

    // Hack around fromNow formatting. We want to keep formatting short only here, so we have to revert back after rendering.
    moment.updateLocale("en", { relativeTime: momentConfigShort });

    const contactList = this.renderContacts(this.props.contacts);

    moment.updateLocale("en", { relativeTime: momentConfigOrig });

    const counts = this.props.contacts.reduce((cts, c) => {
      if (!cts[c.messageStatus]) {
        cts[c.messageStatus] = 1;
      } else {
        cts[c.messageStatus] += 1;
      }
      return cts;
    }, {});

    const statusLabels = {
      needsResponse: "Respond",
      convo: "Past",
      closed: "Skipped"
    };

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
          <IconButton
            aria-controls="filter-contacts"
            aria-haspopup="true"
            onClick={this.openFilterMenu}
          >
            <FilterListIcon />
          </IconButton>
          <Menu
            id="filter-contacts"
            anchorEl={this.state.filterEl}
            open={Boolean(this.state.filterEl)}
            keepMounted
            onClose={this.closeMenu}
          >
            {Object.keys(statusLabels).map(status => (
              <MenuItem
                key={status}
                value={status}
                selected={this.state.statuses.includes(status)}
                onClick={() => {
                  const statuses = [...this.state.statuses];
                  const statusIndex = statuses.indexOf(status);
                  statusIndex === -1
                    ? statuses.push(status)
                    : statuses.splice(statusIndex, 1);

                  this.setState({
                    filterEl: null,
                    statuses
                  });
                }}
              >
                {statusLabels[status]} ({counts[status] || 0})
              </MenuItem>
            ))}
          </Menu>
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
