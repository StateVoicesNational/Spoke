import React from "react";
import type from "prop-types";
import { StyleSheet, css } from "aphrodite";
import _ from "lodash";
import GSForm from "../components/forms/GSForm";
import yup from "yup";
import Form from "react-formal";
import CampaignFormSectionHeading from "../components/CampaignFormSectionHeading";
import { ListItem, List } from "material-ui/List";
import AutoComplete from "material-ui/AutoComplete";
import RaisedButton from "material-ui/RaisedButton";
import Checkbox from "material-ui/Checkbox";
import IconButton from "material-ui/IconButton/IconButton";
import AddIcon from "material-ui/svg-icons/content/add-circle";
import RemoveIcon from "material-ui/svg-icons/content/remove-circle";
import theme from "../styles/theme";
// import { dataTest } from "../lib/attributes";

const maxNumbersPerCampaign = 400;

const styles = StyleSheet.create({
  container: {
    border: `1px solid ${theme.colors.lightGray}`,
    borderRadius: 8
  },
  removeButton: {
    width: 50
  },
  headerContainer: {
    display: "flex",
    alignItems: "center",
    borderBottom: `1px solid ${theme.colors.lightGray}`,
    marginBottom: 0,
    padding: 10
  },
  input: {
    width: 50,
    paddingLeft: 0,
    paddingRight: 0,
    marginRight: 10,
    marginTop: "auto",
    marginBottom: "auto",
    display: "inline-block"
  },
  errorMessage: {
    margin: "10px 0px",
    color: theme.colors.red
  }
});

const inlineStyles = {
  autocomplete: {
    marginBottom: 24,
    width: "100%"
  },
  header: {
    ...theme.text.header
  }
};

export default class CampaignPhoneNumbersForm extends React.Component {
  static propTypes = {
    formValues: type.object,
    onChange: type.func,
    customFields: type.array,
    saveLabel: type.string,
    phoneNumberCounts: type.array,
    contactsCount: type.number,
    onSubmit: type.func,
    saveDisabled: type.bool,
    contactsPerPhoneNumber: type.number,
    inventoryCounts: type.array,
    isStarted: type.bool,
    contactsAreaCodeCounts: type.array
  };

  state = {
    isRendering: true,
    searchText: "",
    showOnlySelected: false,
    error: "",
    suppressedAreaCodes: []
  };

  formSchema = yup.object({
    areaCode: yup.string(), // TODO: validate
    count: yup.number()
  });

  componentDidMount() {
    const {
      phoneNumberCounts,
      contactsAreaCodeCounts,
      contactsPerPhoneNumber
    } = this.props;

    setTimeout(() => {
      /* okay this is wonky, but twilio confirmed that if you have
         Area Code Geo-Match enabled, it will always choose the phone
         with the matching area code. this means if you have a list
         of 50k contacts all in a 917 area code but only one phone
         in 917, they will all send from that phone. they will also be
         throttled at 1message per second. not good. so we need to not
         use matching area codes if there are too few to cover our list */
      const suppressedAreaCodes = contactsAreaCodeCounts
        .map(contacts => {
          const needed = Math.ceil(contacts.count / contactsPerPhoneNumber);
          const { availableCount } =
            phoneNumberCounts.find(
              phones =>
                phones.areaCode === contacts.areaCode && phones.availableCount
            ) || {};

          if (availableCount < needed) return contacts.areaCode;
          return null;
        })
        .filter(Boolean);

      this.setState({ suppressedAreaCodes, isRendering: false });
    });
  }

  formValues() {
    return {
      ...this.props.formValues,
      inventoryPhoneNumberCounts: this.props.formValues
        .inventoryPhoneNumberCounts
    };
  }

  getTotalNumberCount = numbers =>
    numbers.reduce((acc, entry) => (acc = acc + entry.count), 0);

  subtitle = () => {
    const { contactsPerPhoneNumber } = this.props;
    return (
      <div>
        Select the area codes you would like to use for your campaign.
        <ul>
          <li>Contact an admin if you need more numbers.</li>
          <li>
            You can only assign one phone number for every{" "}
            {contactsPerPhoneNumber} contacts.
          </li>
          <li>
            Auto-Reserve first tries to find an exact match on area code,
            <br />
            then tries to find other area codes in the same state,
            <br />
            finally falling back to randomly assigning remaining area codes.
          </li>
          <li>
            When done texting and replying, you will need to archive the
            campaign
            <br />
            and release the phone numbers so other campaigns can use them.
          </li>
        </ul>
      </div>
    );
  };

  showSearch() {
    const { isStarted, phoneNumberCounts } = this.props;

    if (phoneNumberCounts.length === 0) {
      return (
        <div style={inlineStyles.autocomplete}>No phone numbers available</div>
      );
    }

    const filter = (searchText, key) =>
      key === "allphoneNumbers"
        ? true
        : AutoComplete.caseInsensitiveFilter(searchText, key);

    const autocomplete = (
      <AutoComplete
        ref="autocomplete"
        style={inlineStyles.autocomplete}
        onUpdateInput={searchText => this.setState({ searchText })}
        searchText={this.state.searchText}
        filter={filter}
        hintText="Find State or Area Code"
        name="areaCode"
        label="Find State or Area Code"
        dataSource={[]}
      />
    );
    const showAutocomplete = !isStarted && phoneNumberCounts.length > 0;
    return <div>{showAutocomplete ? autocomplete : ""}</div>;
  }

  getNumbersCount = count => (count === 1 ? "number" : "numbers");

  showPhoneNumbers() {
    const {
      isRendering,
      searchText,
      showOnlySelected,
      suppressedAreaCodes
    } = this.state;
    const { isStarted, contactsCount, contactsPerPhoneNumber } = this.props;
    const { inventoryPhoneNumberCounts: reservedNumbers } = this.formValues();
    const assignedNumberCount = this.getTotalNumberCount(reservedNumbers);
    const numbersNeeded = Math.ceil(contactsCount / contactsPerPhoneNumber);

    /* need to add selected phone counts to available phones;
       if navigated away after initial selection, the selected
       area codes will be removed from the counts passed down (from org) */
    let areaCodes = _.orderBy(
      this.props.phoneNumberCounts
        .map(phoneNumber => {
          const foundReserved = this.props.inventoryCounts.find(
            reserved => reserved.areaCode === phoneNumber.areaCode
          ) || { count: 0 };

          return {
            ...phoneNumber,
            allocatedCount: isStarted
              ? foundReserved.count
              : phoneNumber.allocatedCount + foundReserved.count,
            availableCount: phoneNumber.availableCount + foundReserved.count
          };
        })
        .filter(phoneNumber => (isStarted ? phoneNumber.allocatedCount : true)),
      ["state", "areaCode"]
    );

    if (showOnlySelected) {
      areaCodes = areaCodes.filter(item =>
        reservedNumbers.find(reserved => reserved.areaCode === item.areaCode)
      );
    }

    if (searchText) {
      if (!isNaN(searchText) && searchText.length <= 3) {
        const foundAreaCode = areaCodes.find(({ areaCode }) =>
          areaCode.includes(searchText)
        );
        areaCodes = foundAreaCode ? [foundAreaCode] : [];
      } else if (isNaN(searchText)) {
        areaCodes = areaCodes.filter(({ state }) =>
          state.toLowerCase().includes(searchText.toLowerCase())
        );
      }
    }

    const states = Array.from(new Set(areaCodes.map(({ state }) => state)));

    const getAssignedCount = areaCode => {
      const inventory = this.formValues().inventoryPhoneNumberCounts;
      return (
        (inventory.find(item => item.areaCode === areaCode) || {}).count || 0
      );
    };

    const assignAreaCode = areaCode => {
      const inventory = this.formValues().inventoryPhoneNumberCounts;
      const inventoryPhoneNumberCounts = inventory.find(
        item => item.areaCode === areaCode
      )
        ? inventory.map(item =>
            item.areaCode === areaCode
              ? { ...item, count: item.count + 1 }
              : item
          )
        : [...inventory, { areaCode, count: 1 }];

      this.props.onChange({ inventoryPhoneNumberCounts });
      if (_.sumBy(inventoryPhoneNumberCounts, "count") === numbersNeeded) {
        this.setState({ showOnlySelected: true });
      }
    };

    const unassignAreaCode = areaCode => {
      const inventory = this.formValues().inventoryPhoneNumberCounts;
      const inventoryPhoneNumberCounts = inventory
        .map(item =>
          item.areaCode === areaCode ? { ...item, count: item.count - 1 } : item
        )
        .filter(item => item.count);

      this.props.onChange({ inventoryPhoneNumberCounts });

      if (!inventoryPhoneNumberCounts.length && showOnlySelected) {
        this.setState({ showOnlySelected: false });
      }
    };

    return (
      <List
        style={{
          maxHeight: 360,
          minHeight: 360,
          overflowY: "auto",
          padding: "0 15px 0 0"
        }}
      >
        {!isRendering &&
          states.map(state => (
            <ListItem
              key={state}
              primaryText={state}
              primaryTogglesNestedList
              initiallyOpen
              nestedItems={areaCodes
                .filter(areaCode => areaCode.state === state)
                .map(({ areaCode, availableCount }) => {
                  const assignedCount = getAssignedCount(areaCode);
                  const isSuppressed = suppressedAreaCodes.includes(areaCode);
                  return (
                    <ListItem
                      key={areaCode}
                      style={{
                        marginBottom: 15,
                        height: 16,
                        border: "1px solid rgb(225, 228, 224)",
                        borderRadius: 8
                      }}
                      disabled
                      primaryText={
                        <span>
                          <span
                            style={{
                              marginRight: 90,
                              width: 50
                            }}
                          >
                            {areaCode}
                          </span>
                          <span
                            style={{
                              color: isSuppressed
                                ? theme.colors.red
                                : theme.colors.gray
                            }}
                          >
                            {`${assignedCount}${
                              !isStarted ? ` / ${availableCount}` : ""
                            }`}
                          </span>
                        </span>
                      }
                      rightIconButton={
                        !isStarted &&
                        (!isSuppressed ? (
                          <div style={{ marginRight: 50 }}>
                            <IconButton
                              disabled={!assignedCount}
                              onClick={() => unassignAreaCode(areaCode)}
                            >
                              <RemoveIcon />
                            </IconButton>
                            <IconButton
                              disabled={
                                assignedCount === availableCount ||
                                assignedNumberCount === numbersNeeded
                              }
                              onClick={() => assignAreaCode(areaCode)}
                            >
                              <AddIcon />
                            </IconButton>
                          </div>
                        ) : (
                          <div
                            style={{
                              marginTop: 15,
                              marginRight: 10,
                              color: theme.colors.red,
                              fontSize: 14
                            }}
                          >
                            Not Enough to Reserve
                          </div>
                        ))
                      }
                    />
                  );
                })}
            />
          ))}
      </List>
    );
  }

  renderErrorMessage() {
    const { error } = this.state;
    return <div className={css(styles.errorMessage)}>{error}</div>;
  }

  areaCodeTable() {
    const { inventoryPhoneNumberCounts: reservedNumbers } = this.formValues();
    const assignedNumberCount = this.getTotalNumberCount(reservedNumbers);
    const {
      isStarted,
      inventoryCounts,
      contactsCount,
      contactsAreaCodeCounts,
      contactsPerPhoneNumber
    } = this.props;
    const numbersNeeded = Math.ceil(contactsCount / contactsPerPhoneNumber);
    let remaining = numbersNeeded - assignedNumberCount;

    const headerColor =
      assignedNumberCount === numbersNeeded
        ? theme.colors.darkBlue
        : theme.colors.red;

    const autoAssignRemaining = () => {
      let inventory = this.formValues().inventoryPhoneNumberCounts;
      const { suppressedAreaCodes } = this.state;

      const availableAreaCodes = _.flatten(
        this.props.phoneNumberCounts
          .filter(
            phoneNumber =>
              // see NOTE in componentDidMount
              !suppressedAreaCodes.includes(phoneNumber.areaCode)
          )
          .map(phoneNumber => {
            const foundAllocated = inventory.find(
              ({ areaCode }) => areaCode === phoneNumber.areaCode
            ) || { count: 0 };

            /* until we save and navigate back and props.inventoryCounts
             has values, the phoneNumberCounts will need to have the
             "form state inventory" subtracted from the available count */
            const availableCount = !inventoryCounts.length
              ? phoneNumber.availableCount - foundAllocated.count
              : phoneNumber.availableCount;

            return Array.from(Array(availableCount)).map(() => ({
              areaCode: phoneNumber.areaCode,
              state: phoneNumber.state
            }));
          })
      );

      /* eslint-disable no-param-reassign */

      const matchedFromContacts = _.orderBy(
        contactsAreaCodeCounts,
        ["count"],
        ["desc"]
        // prioritze assigning the area codes with the most contacts
      ).reduce((obj, contacts) => {
        const needed = Math.ceil(contacts.count / contactsPerPhoneNumber);
        // ignore outlier (less than .5% coverage) area codes
        if ((contactsCount / needed) * 100 < 1) return obj;

        let foundAvailable = availableAreaCodes.filter(
          avail => avail.areaCode === contacts.areaCode
        );

        if (remaining < needed) {
          /* if we can only select less than are needed for full
             coverage on this areacode then we should select none.
             see NOTE in componentDidMount */
          foundAvailable = [];
        }

        if (!foundAvailable.length) {
          // if no exact match, try to fall back to state match
          foundAvailable = _.shuffle(availableAreaCodes)
            .filter(avail => avail.state === contacts.state)
            .slice(0, remaining);
        }

        // if nothing found, skip to be randomly assigned
        if (!foundAvailable.length) return obj;

        if (foundAvailable.length > needed) {
          // if we've got more than needed, randomly pick them
          foundAvailable = _.shuffle(foundAvailable).slice(0, needed);
          // otherwise use them all!
        }

        foundAvailable.forEach(avail => {
          obj[avail.areaCode] = (obj[avail.areaCode] || 0) + 1;
        });

        // now remove these from available
        foundAvailable.forEach(found => {
          availableAreaCodes.splice(
            availableAreaCodes.findIndex(
              avail => avail.areaCode === found.areaCode
            ),
            1
          );
        });

        remaining -= foundAvailable.length;

        return obj;
      }, {});

      let randomSample = {};

      if (remaining) {
        randomSample = _.sampleSize(availableAreaCodes, remaining).reduce(
          (obj, sample) => {
            if (matchedFromContacts[sample.areaCode]) {
              matchedFromContacts[sample.areaCode] += 1;
            } else {
              obj[sample.areaCode] = (obj[sample.areaCode] || 0) + 1;
            }
            return obj;
          },
          {}
        );
      }

      // if these area codes are already selected, add the new counts
      inventory = inventory.map(inventoryItem => {
        let count = inventoryItem.count;
        if (randomSample[inventoryItem.areaCode]) {
          count += randomSample[inventoryItem.areaCode];
          delete randomSample[inventoryItem.areaCode];
        }

        if (matchedFromContacts[inventoryItem.areaCode]) {
          count += matchedFromContacts[inventoryItem.areaCode];
          delete matchedFromContacts[inventoryItem.areaCode];
        }

        return {
          ...inventoryItem,
          count
        };
      });

      this.props.onChange({
        inventoryPhoneNumberCounts: [
          ...inventory,
          ...Object.entries({
            ...matchedFromContacts,
            ...randomSample
          }).map(([areaCode, count]) => ({
            areaCode,
            count
          }))
        ]
      });

      this.setState({ showOnlySelected: true });
    };

    return (
      <div
        className={css(styles.container)}
        style={{ flex: 1, marginRight: 50, maxWidth: 500 }}
      >
        <div className={css(styles.headerContainer)} style={{ height: 90 }}>
          <div
            style={{
              flex: 1,
              fontSize: 22,
              color: headerColor
            }}
          >
            <div style={{ margin: "5px 0 10px 5px" }}>
              {`Reserved phone numbers: ${assignedNumberCount}/${numbersNeeded}`}
            </div>
            {!isStarted && (
              <div style={{ display: "flex" }}>
                <RaisedButton
                  style={{ margin: "0 0 5px 5px" }}
                  label={`Auto-Reserve Remaining ${remaining}`}
                  secondary
                  disabled={!remaining}
                  onClick={() => autoAssignRemaining()}
                />

                <Checkbox
                  style={{
                    margin: "5px 5px 0 auto",
                    fontSize: 14,
                    width: "auto"
                  }}
                  iconStyle={{ marginLeft: 4 }}
                  disabled={!reservedNumbers.length}
                  labelPosition="left"
                  label="Only show reserved"
                  checked={this.state.showOnlySelected}
                  onCheck={() => {
                    this.setState(({ showOnlySelected }) => ({
                      showOnlySelected: !showOnlySelected,
                      searchText: ""
                    }));
                  }}
                />
              </div>
            )}
          </div>
        </div>
        {this.showPhoneNumbers()}
      </div>
    );
  }

  contactsAreaCodesTable() {
    const { isRendering, searchText } = this.state;
    const { contactsCount, contactsPerPhoneNumber } = this.props;

    let areaCodes = _.orderBy(
      // filter outlying with less than 1% of contacts
      this.props.contactsAreaCodeCounts.filter(
        item => (item.count / contactsCount) * 100 >= 1
      ),
      ["count", "state", "areaCode"],
      ["desc"]
    );

    const states = Object.entries(
      areaCodes.reduce((obj, item) => {
        return {
          ...obj,
          [item.state]: (obj[item.state] || 0) + item.count
        };
      }, {})
    ).map(([state, count]) => ({
      state,
      needed: Math.ceil(count / contactsPerPhoneNumber)
    }));

    const getAssignedCount = ({ state, areaCode }) => {
      const inventory = this.formValues().inventoryPhoneNumberCounts;
      if (state) {
        return _.sumBy(
          inventory.filter(invItem =>
            areaCodes.find(
              item => item.areaCode === invItem.areaCode && item.state === state
            )
          ),
          "count"
        );
      }
      return (inventory.find(item => item.areaCode === areaCode) || {}).count;
    };

    if (searchText) {
      if (!isNaN(searchText) && searchText.length <= 3) {
        const foundAreaCode = areaCodes.find(({ areaCode }) =>
          areaCode.includes(searchText)
        );
        areaCodes = foundAreaCode ? [foundAreaCode] : [];
      } else if (isNaN(searchText)) {
        areaCodes = areaCodes.filter(({ state }) =>
          state.toLowerCase().includes(searchText.toLowerCase())
        );
      }
    }

    return (
      <div className={css(styles.container)} style={{ flex: 1, maxWidth: 340 }}>
        <div className={css(styles.headerContainer)} style={{ height: 30 }}>
          <div
            style={{
              fontSize: 15,
              color: theme.colors.darkBlue
            }}
          >
            Top Area Codes in Contacts List
          </div>
        </div>
        <List
          style={{
            maxHeight: 420,
            minHeight: 420,
            overflowY: "auto",
            padding: "0 15px 0 0"
          }}
        >
          {!isRendering &&
            states.map(({ state, needed: stateNeeded }) => {
              const stateAssigned = getAssignedCount({ state });
              return (
                <ListItem
                  key={state}
                  primaryText={
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center"
                      }}
                    >
                      <span style={{ width: 170 }}>{state}</span>
                      <span
                        style={{
                          width: 70,
                          fontSize: 14,
                          color:
                            stateAssigned && stateAssigned >= stateNeeded
                              ? theme.colors.green
                              : stateAssigned
                              ? theme.colors.blue
                              : theme.colors.black
                        }}
                      >
                        {stateAssigned || 0}
                        {" / "}
                        {stateNeeded}
                      </span>
                    </div>
                  }
                  primaryTogglesNestedList
                  initiallyOpen
                  nestedItems={areaCodes
                    .filter(areaCode => areaCode.state === state)
                    .map(({ areaCode, count }) => {
                      const needed = Math.ceil(count / contactsPerPhoneNumber);
                      const assignedCount = getAssignedCount({ areaCode });
                      return (
                        <ListItem
                          key={areaCode}
                          style={{
                            marginLeft: 15,
                            marginBottom: 15,
                            border: "1px solid rgb(225, 228, 224)",
                            borderRadius: 8
                          }}
                          primaryText={
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center"
                              }}
                            >
                              <span style={{ marginLeft: -15, width: 80 }}>
                                {areaCode}
                              </span>
                              <span
                                style={{
                                  width: 70,
                                  fontSize: 14,
                                  color:
                                    assignedCount && assignedCount >= needed
                                      ? theme.colors.green
                                      : assignedCount
                                      ? theme.colors.red
                                      : theme.colors.black
                                }}
                              >
                                {assignedCount || 0}
                                {" / "}
                                {needed}
                              </span>

                              <span
                                style={{
                                  marginLeft: "auto",
                                  fontSize: 14,
                                  color: theme.colors.blue
                                }}
                              >
                                {((count / contactsCount) * 100).toFixed(1)}
                              </span>
                              <span style={{ marginLeft: 2, fontSize: 14 }}>
                                %
                              </span>
                            </div>
                          }
                        />
                      );
                    })}
                />
              );
            })}
        </List>
      </div>
    );
  }

  render() {
    const { inventoryPhoneNumberCounts: reservedNumbers } = this.formValues();
    const assignedNumberCount = this.getTotalNumberCount(reservedNumbers);
    const { contactsCount, contactsPerPhoneNumber } = this.props;
    const numbersNeeded = Math.ceil(contactsCount / contactsPerPhoneNumber);

    return (
      <GSForm
        schema={this.formSchema}
        value={this.formValues()}
        onChange={this.props.onChange}
        onSubmit={() => {
          if (assignedNumberCount === numbersNeeded) {
            this.props.onSubmit();
          }
        }}
      >
        <CampaignFormSectionHeading
          title="Phone Numbers"
          subtitle={this.subtitle()}
        />
        {numbersNeeded <= maxNumbersPerCampaign ? (
          <div>
            {this.showSearch()}
            {this.state.error && this.renderErrorMessage()}
            <div
              style={{
                display: "flex"
              }}
            >
              {this.areaCodeTable()}
              {this.contactsAreaCodesTable()}
            </div>

            <Form.Button
              type="submit"
              disabled={
                this.props.saveDisabled || assignedNumberCount !== numbersNeeded
              }
              label={this.props.saveLabel}
            />
          </div>
        ) : (
          <div
            style={{
              flex: "1 1 50%",
              fontSize: 22,
              color: theme.colors.red
            }}
          >
            Sorry, you need to upload fewer contacts!
          </div>
        )}
      </GSForm>
    );
  }
}
