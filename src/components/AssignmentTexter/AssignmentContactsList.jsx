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
import Menu from "@material-ui/core/Menu";
import Pagination from "@material-ui/lab/Pagination";

const pageSize = 50;

const statusLabels = {
  needsResponse: "Respond",
  convo: "Past",
  closed: "Skipped"
};

class AssignmentContactsList extends React.Component {
  constructor(props) {
    super(props);

    const counts = props.contacts.reduce((cts, c) => {
      if (!cts[c.messageStatus]) {
        cts[c.messageStatus] = 0;
      }

      cts[c.messageStatus] += 1;
      return cts;
    }, {});

    this.state = {
      search: "",
      currentPage: 0,
      filterEl: null,
      statuses: Object.keys(statusLabels),
      counts
    };
  }

  resetCurrentPage = () => {
    const filteredContacts = this.getFilteredContacts(this.props.contacts);
    const currentIndex = filteredContacts.findIndex(
      c => c.id === this.props.currentContact.id
    );

    this.setState({
      currentPage: currentIndex == -1 ? 0 : Math.floor(currentIndex / pageSize)
    });
  };

  getContactListItemId = id => `switch-to-contact-id-${id}`;

  focusOnCurrentContact = () => {
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
  };

  componentDidMount = () => {
    this.resetCurrentPage();
    this.focusOnCurrentContact();
  };

  openFilterMenu = e => this.setState({ filterEl: e.currentTarget });
  closeMenu = () => this.setState({ filterEl: null });

  handleFilterUpdate = status => {
    const statuses = [...this.state.statuses];
    const statusIndex = statuses.indexOf(status);

    statusIndex === -1
      ? statuses.push(status)
      : statuses.splice(statusIndex, 1);

    this.setState(
      {
        statuses
      },
      this.resetCurrentPage
    );
  };

  getContactName = contact => {
    return `${contact.firstName} ${contact.lastName &&
      `${contact.lastName.slice(0, 1)}.`}`;
  };

  getFilteredContacts = contacts => {
    return contacts.filter(
      c =>
        this.state.statuses.includes(c.messageStatus) &&
        this.getContactName(c)
          .toLowerCase()
          .includes(this.state.search.toLowerCase())
    );
  };

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
          primary={this.getContactName(contact)}
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
            {moment.utc(contact.updatedAt).fromNow()}
          </span>
        </ListItemSecondaryAction>
      </ListItem>
    );
  };

  renderContacts = filteredContacts => {
    const contactsToDisplay = filteredContacts.slice(
      this.state.currentPage * pageSize,
      this.state.currentPage * pageSize + pageSize
    );

    return contactsToDisplay.map(this.renderContact);
  };

  render() {
    const momentConfigOrig = moment()
      .locale("en")
      .localeData()._relativeTime;

    // Hack around fromNow formatting. We want to keep formatting short only here, so we have to revert back after rendering.
    moment.updateLocale("en", { relativeTime: momentConfigShort });

    const filteredContacts = this.getFilteredContacts(this.props.contacts);
    const totalPages = Math.ceil(filteredContacts.length / pageSize);

    const contactList = this.renderContacts(filteredContacts);

    moment.updateLocale("en", { relativeTime: momentConfigOrig });

    return (
      <div style={inlineStyles.contactsListParent}>
        <div style={inlineStyles.searchBar}>
          <SearchBar
            onChange={search =>
              this.setState({ search: search || "", currentPage: 0 })
            }
            onCancelSearch={() => this.setState({ search: "", currentPage: 0 })}
            onRequestSearch={() => undefined}
            placeholder="Search Contacts"
            value={this.state.search}
            style={inlineStyles.contactsListSearch}
          />
          <IconButton
            onClick={this.openFilterMenu}
            aria-controls="contacts-sidebar-status-filter"
            aria-haspopup="true"
          >
            <FilterListIcon />
          </IconButton>
          <Menu
            id="contacts-sidebar-status-filter"
            anchorEl={this.state.filterEl}
            open={!!this.state.filterEl}
            onClose={this.closeMenu}
            keepMounted
          >
            {Object.keys(statusLabels).map(status => (
              <MenuItem
                key={status}
                selected={this.state.statuses.includes(status)}
                onClick={() => this.handleFilterUpdate(status)}
              >
                {statusLabels[status]} ({this.state.counts[status] || 0})
              </MenuItem>
            ))}
          </Menu>
        </div>
        <List
          id="assignment-contacts-list"
          style={inlineStyles.contactListScrollContainer}
        >
          {contactList}
        </List>
        {totalPages > 1 && (
          <Pagination
            count={totalPages}
            page={this.state.currentPage + 1}
            onChange={(_, page) => this.setState({ currentPage: page - 1 })}
            style={inlineStyles.pagination}
            size="small"
          />
        )}
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
  searchBar: {
    display: "flex",
    backgroundColor: "rgba(126, 128, 139, .7)"
  },
  contactsListSearch: {
    height: 32,
    margin: "12px 0 12px 12px"
  },
  contactListScrollContainer: {
    overflow: "hidden scroll",
    borderRight: "1px solid #C1C3CC",
    height: "100%"
  },
  updatedAt: {
    fontSize: 12,
    width: "auto",
    top: "auto",
    margin: "0 4px"
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    padding: 12,
    borderRight: "1px solid #C1C3CC"
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
