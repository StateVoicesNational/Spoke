import PropTypes from "prop-types";
import React from "react";
import IconButton from "material-ui/IconButton/IconButton";
import LoadingIndicator from "../LoadingIndicator";
import { StyleSheet, css } from "aphrodite";
import { withRouter } from "react-router";
import Check from "material-ui/svg-icons/action/check-circle";
import Empty from "../Empty";
import RaisedButton from "material-ui/RaisedButton";

const styles = StyleSheet.create({
  container: {
    position: "fixed",
    top: 0,
    left: 0,
    // right: 0,
    // bottom: 0
    width: "100%",
    height: "100%",
    zIndex: 1002,
    backgroundColor: "white",
    overflow: "hidden"
  }
});

export class ContactController extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      // currentContactIndex: 0,
      contactCache: {},
      loading: false,
      direction: "right",
      reloadDelay: 200
    };
  }

  componentWillMount() {
    let startIndex = 0;
    if (this.props.reviewContactId) {
      startIndex = this.props.contacts.findIndex(
        c => c.id == this.props.reviewContactId
      );
      if (startIndex === -1) {
        startIndex = 0;
      }
    }
    this.updateCurrentContactIndex(startIndex);
  }

  componentWillUpdate(nextProps, nextState) {
    // When we send a message that changes the contact status,
    // then if parent.refreshData is called, then props.contacts
    // will return a new list with the last contact removed and
    // presumably our currentContactIndex will be off.
    // In fact, without the code below, we will 'double-jump' each message
    // we send or change the status in some way.
    // Below, we update our index with the contact that matches our current index.

    if (nextState.currentContactIndex != this.state.currentContactIndex) {
      console.log(
        "updateindex <cur> <next>",
        this.state.currentContactIndex,
        nextState.currentContactIndex
      );
    }
    const diffContactList =
      (nextProps.contacts[nextState.currentContactIndex] || {}).id !==
        (this.props.contacts[nextState.currentContactIndex] || {}).id ||
      nextProps.contacts.length !== this.props.contacts.length;
    if (diffContactList) {
      console.log(
        "update contacts <cur> <next>",
        this.state.currentContactIndex,
        nextState.currentContactIndex,
        this.props.contacts,
        nextProps.contacts
      );
    }
    if (
      typeof nextState.currentContactIndex !== "undefined" &&
      nextState.currentContactIndex === this.state.currentContactIndex &&
      diffContactList
    ) {
      if (this.props.contacts[this.state.currentContactIndex]) {
        // If we have a contact, then find it in the new list
        const curId = this.props.contacts[this.state.currentContactIndex].id;
        const nextIndex = nextProps.contacts.findIndex(c => c.id === curId);
        if (nextIndex !== nextState.currentContactIndex) {
          // console.log('changingIndex on update <cur><next><curId><curList><nextList>',
          //             nextState.currentContactIndex, nextIndex,
          //             curId,
          //             this.props.contacts, nextProps.contacts)
          // eslint-disable-next-line no-param-reassign
          nextState.currentContactIndex = Math.max(nextIndex, 0);
          // nextIndex can be -1 if not found, and in that case, we should defer to the front
        }
      } else if (this.state.currentContactIndex >= this.props.contacts.length) {
        // If our contacts data isn't available then we should just go to the beginning
        // This pathological situation happens during dynamic assignment sometimes
        nextState.currentContactIndex = 0;
      }
    }
  }
  /*
    getContactData is a place where we've hit scaling issues in the past, and will be important
    to think carefully about for scaling considerations in the future.

    As p2ptextbanking work scales up, texters will contact more people, and so the number of
    contacts in a campaign and the frequency at which we need to get contact data will increase.

    Previously, when the texter clicked 'next' from the texting screen, we'd load a list of contact metadata
    to text next, and then as this data was rendered into the AssignmentTexter and AssignmentTexterContact
    containers, we'd load up each contact in the list separately, doing an API call and database query
    for each contact. For each of the O(n) contacts to text, in aggregate this yielded O(n^2) API calls and
    database queries.

    This round of changes is a mostly client-side structural optimization that will make it so that
    O(n) contacts to text results in O(n) queries. There will also be later rounds of server-side optimization.

    You'll also see references to "contact cache" below--
    this is different than a redis cache, and it's a reference to this component storing contact data in its state,
    which is a form of in-memory client side caching. A blended set of strategies -- server-side optimization,
    getting data from the data store in batches, and storing batches in the component that
    is rendering this data-- working in concert will be key to achieving our scaling goals.

    In addition to getting all the contact data needed to text contacts at once instead of in a nested loop,
    these changes get a batch of contacts at a time with a moving batch window. BATCH_GET is teh number of contacts
    to get at a time, and BATCH_FORWARD is how much before the end of the batch window to prefetch the next batch.

    Example with BATCH_GET = 10 and BATCH_FORWARD = 5 :
      - starting out in the contact list, we get contacts 0-9, and then get their associated data in batch
      via this.props.loadContacts(getIds)
      - texter starts texting through this list, texting contact 0, 1, 2, 3. we do not need to make any more
      API or database calls because we're using data we already got and stored in this.state.contactCache
      - when the texter gets to contact 4, contacts[newIndex + BATCH_FORWARD] is now false, and thts tells us we
      should get the next batch, so the next 10 contacts (10-19) are loaded up into this.state.contactCache
      - when the texter gets to contact 10, contact 10 has already been loaded up into this.state.contactCache and
      so the texter wont likely experience a data loading delay

    getContactData runs when the user clicks the next arrow button on the contact screen.

  */
  getContactData = async (newIndex, force = false) => {
    const { contacts } = this.props;
    const BATCH_GET = 10; // how many to get at once
    const BATCH_FORWARD = 5; // when to reach out and get more
    let getIds = [];
    // if we don't have current data, get that
    if (contacts[newIndex] && !this.state.contactCache[contacts[newIndex].id]) {
      getIds = contacts
        .slice(newIndex, newIndex + BATCH_GET)
        .map(c => c.id)
        .filter(cId => !force || !this.state.contactCache[cId]);
      // console.log('getContactData missing current', newIndex, getIds)
    }
    // if we DO have current data, but don't have data base BATCH_FORWARD...
    if (
      !getIds.length &&
      contacts[newIndex + BATCH_FORWARD] &&
      !this.state.contactCache[contacts[newIndex + BATCH_FORWARD].id]
    ) {
      getIds = contacts
        .slice(newIndex + BATCH_FORWARD, newIndex + BATCH_FORWARD + BATCH_GET)
        .map(c => c.id)
        .filter(cId => !force || !this.state.contactCache[cId]);
      // console.log('getContactData batch forward ', getIds)
    } else if (
      !getIds.length &&
      this.props.assignment.campaign.useDynamicAssignment &&
      // If we have just crossed the threshold of contact data we have, get more
      contacts[newIndex + BATCH_FORWARD - 1] &&
      !contacts[newIndex + BATCH_FORWARD]
    ) {
      this.props.getNewContacts();
    }
    if (getIds.length) {
      // console.log('getContactData length', newIndex, getIds.length)
      this.setState({ loading: true });
      const contactData = await this.props.loadContacts(getIds);
      const {
        data: { getAssignmentContacts }
      } = contactData;
      if (getAssignmentContacts) {
        const newContactData = {};
        getAssignmentContacts.forEach((c, i) => {
          if (c && c.id) {
            newContactData[c.id] = c;
          } else {
            // store the null result so that we know to skip it
            const badId = getIds[i];
            newContactData[badId] = null;
          }
        });
        // console.log('getContactData results<new data>', newContactData, getAssignmentContacts)
        this.setState({
          loading: false,
          contactCache: { ...this.state.contactCache, ...newContactData }
        });
      }
    }
  };

  getContact(contacts, index) {
    if (contacts.length > index) {
      // console.log('getcontact', index, (contacts[index]||{}).id, (contacts.length > index + 1 ? 'next' + (contacts[index+1]||{}).id : 'end'))
      return contacts[index];
    }
    return null;
  }

  incrementCurrentContactIndex = increment => {
    // console.log('incrementCurIndex', this.state.currentContactIndex, (this.props.contacts[this.state.currentContactIndex]||{}).id, this.props.contacts.length)
    let newIndex = this.state.currentContactIndex;
    newIndex = newIndex + increment;
    this.updateCurrentContactIndex(newIndex);
  };

  updateCurrentContactIndex(newIndex, newDelay) {
    const updateState = {
      currentContactIndex: newIndex
    };
    if (newDelay) {
      updateState.reloadDelay = Math.min(newDelay, 5000);
    }
    this.setState(updateState);
    this.getContactData(newIndex);
  }

  hasPrevious() {
    return this.state.currentContactIndex > 0;
  }

  hasNext() {
    return this.state.currentContactIndex < this.contactCount() - 1;
  }

  handleFinishContact = contactId => {
    if (this.hasNext()) {
      this.handleNavigateNext();
      this.clearContactIdOldData(contactId);
    } else {
      // Will look async and then redirect to todo page if not
      console.log(
        "handleFinishContact<ctct><ind><contacts.len>",
        this.props.contacts[this.state.currentContactIndex],
        this.state.currentContactIndex,
        this.props.contacts.length
      );
      const self = this;
      this.props
        .assignContactsIfNeeded(
          /* checkServer */ true,
          this.state.currentContactIndex
        )
        .then(giveUpAction => {
          self.clearContactIdOldData(contactId);
          console.log(
            "should we give up?!",
            self.state.currentContactIndex,
            self.props.contacts && self.props.contacts.length,
            giveUpAction
          );
          // If we still don't have a next item (contacts haven't updated), then give up
          if (!self.hasNext() && typeof giveUpAction === "function") {
            giveUpAction();
          }
        });
    }
  };

  clearContactIdOldData = contactId => {
    // If contactId was mutated, clear current data
    if (contactId) {
      // console.log('updating state', contactId, this.props.contacts.findIndex((c) => c.id === contactId))
      this.setState({
        contactCache: { ...this.state.contactCache, [contactId]: undefined }
      });
    }
  };

  handleNavigateNext = () => {
    if (!this.hasNext()) {
      return;
    }

    // this.props.refreshData()
    this.setState({ direction: "right" }, () =>
      this.incrementCurrentContactIndex(1)
    );
  };

  handleNavigatePrevious = () => {
    if (!this.hasPrevious()) {
      return;
    }
    this.setState({ direction: "left" }, () =>
      this.incrementCurrentContactIndex(-1)
    );
  };

  handleCannedResponseChange = script => {
    this.handleScriptChange(script);
    this.handleClosePopover();
  };

  handleScriptChange = script => {
    this.setState({ script });
  };

  handleExitTexter = () => {
    this.props.router.push("/app/" + (this.props.organizationId || ""));
  };

  contactCount() {
    const { contacts } = this.props;
    return contacts.length;
  }

  currentContact() {
    const { contacts } = this.props;
    // If the index has got out of sync with the contacts available, then rewind to the start
    if (typeof this.state.currentContactIndex !== "undefined") {
      return this.getContact(contacts, this.state.currentContactIndex);
    }

    this.updateCurrentContactIndex(0);
    return this.getContact(contacts, 0);
  }

  getNavigationToolbarChildren() {
    const { allContactsCount } = this.props;
    const remainingContacts = this.contactCount();
    const messagedContacts = allContactsCount - remainingContacts;

    const currentIndex = this.state.currentContactIndex + 1 + messagedContacts;
    let total = allContactsCount;
    if (
      total === currentIndex &&
      this.props.assignment.campaign.useDynamicAssignment
    ) {
      total = "?";
    }
    const title = `${currentIndex} of ${total}`;
    return {
      onPrevious: this.hasPrevious() ? this.handleNavigatePrevious : null,
      onNext: this.hasNext() ? this.handleNavigateNext : null,
      currentIndex,
      total,
      title
    };
  }

  renderTexter() {
    const { assignment, ChildComponent } = this.props;
    const { campaign, texter } = assignment;
    const contact = this.currentContact();
    const navigationToolbarChildren = this.getNavigationToolbarChildren();
    if (!contact || !contact.id) {
      console.log("NO CONTACT", contact, this.props);
      return <LoadingIndicator />;
    }
    const contactData = this.state.contactCache[contact.id];
    if (!contactData) {
      const self = this;
      console.log(
        "NO CONTACT DATA <curInd><ctct><reloadDelay><curcontacts>",
        self.state.currentContactIndex,
        contact,
        self.state.reloadDelay,
        this.props.contacts
      );
      setTimeout(() => {
        if (self.state.contactCache[contact.id]) {
          console.log("got the data", contact.id);
          // reset delay back to baseline
          self.setState({ reloadDelay: 200 });
          self.forceUpdate();
        } else if (!self.state.loading) {
          // something isn't loading And we should try some strategies to work around it
          // Case 1: corrupt/problematic single entry
          //   Maybe they don't have access to that contact, etc
          // Strategy: see if we can just skip to the next one

          // console.log('try something',
          //             self.state.currentContactIndex,
          //             self.state.reloadDelay,
          //             self.props.contacts[self.state.currentContactIndex + 1],
          //             (self.props.contacts[self.state.currentContactIndex + 1]||{}).id,
          //             self.props.contacts,
          //             self.state.contactCache[
          //               (self.props.contacts[self.state.currentContactIndex + 1]||{}).id])
          if (
            this.state.contactCache[contact.id] === null &&
            self.props.contacts.length > self.state.currentContactIndex + 1
          ) {
            // The current index was loaded and set as null to be invalid
            console.log("GOT A NULL SKIPPING", self.state.currentContactIndex);
            self.updateCurrentContactIndex(self.state.currentContactIndex + 1);
          } else {
            // Case 2: Maybe loading it was a problem or it's time to load it
            // So let's load again
            // This makes us back off if we keep not having contacts
            self.updateCurrentContactIndex(
              self.state.currentContactIndex,
              2 * self.state.reloadDelay
            );
          }
        }
      }, self.state.reloadDelay);
      return <LoadingIndicator />;
    }
    // ChildComponent is AssignmentTexterContact except for demo/testing
    return (
      <ChildComponent
        key={contact.id}
        assignment={assignment}
        campaignContactId={contact.id}
        reviewContactId={this.props.reviewContactId}
        contact={contactData}
        texter={texter}
        campaign={campaign}
        navigationToolbarChildren={navigationToolbarChildren}
        onFinishContact={this.handleFinishContact}
        refreshData={this.props.refreshData}
        onExitTexter={this.handleExitTexter}
        messageStatusFilter={this.props.messageStatusFilter}
      />
    );
  }
  renderEmpty() {
    return (
      <div>
        <Empty
          title="You've already messaged or replied to all your assigned contacts for now."
          icon={<Check />}
          content={
            <RaisedButton
              label="Back To Todos"
              onClick={this.handleExitTexter}
            />
          }
        />
      </div>
    );
  }
  render() {
    const { contacts } = this.props;
    return (
      <div className={css(styles.container)}>
        {contacts.length === 0 ? this.renderEmpty() : this.renderTexter()}
      </div>
    );
  }
}

ContactController.propTypes = {
  reviewContactId: PropTypes.string, // if not undefined, contactId from a conversation link
  assignment: PropTypes.object, // current assignment
  contacts: PropTypes.array, // contacts for current assignment
  allContactsCount: PropTypes.number,
  router: PropTypes.object,
  refreshData: PropTypes.func,
  loadContacts: PropTypes.func,
  getNewContacts: PropTypes.func,
  assignContactsIfNeeded: PropTypes.func,
  organizationId: PropTypes.string,
  ChildComponent: PropTypes.func,
  messageStatusFilter: PropTypes.string
};

export default withRouter(ContactController);
