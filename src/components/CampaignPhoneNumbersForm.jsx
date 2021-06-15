import React from "react";
import type from "prop-types";
import { StyleSheet, css } from "aphrodite";
import _ from "lodash";
import * as yup from "yup";
import Form from "react-formal";

import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import AddIcon from "@material-ui/icons/Add";
import RemoveIcon from "@material-ui/icons/Remove";
import Checkbox from "@material-ui/core/Checkbox";
import FormControlLabel from "@material-ui/core/FormControlLabel";

import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import Collapse from "@material-ui/core/Collapse";
import ExpandLess from "@material-ui/icons/ExpandLess";
import ExpandMore from "@material-ui/icons/ExpandMore";
import Autocomplete from "@material-ui/lab/Autocomplete";
import TextField from "@material-ui/core/TextField";

import GSForm from "../components/forms/GSForm";
import GSSubmitButton from "../components/forms/GSSubmitButton";
import CampaignFormSectionHeading from "../components/CampaignFormSectionHeading";
import LoadingIndicator from "./LoadingIndicator";
import theme from "../styles/theme";

/* eslint-disable no-nested-ternary */

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

  componentDidMount() {
    this.setSuppressedAreaCodes();

    setTimeout(() => {
      this.setState({
        isRendering: false
      });
    }, 1000);
  }

  setSuppressedAreaCodes = () => {
    const {
      isStarted,
      phoneNumberCounts,
      contactsAreaCodeCounts,
      contactsPerPhoneNumber,
      inventoryCounts
    } = this.props;

    /* okay this is wonky, but twilio confirmed that if you have
       Area Code Geo-Match enabled, it will always choose the phone
       with the matching area code. this means if you have a list
       of 50k contacts all in a 917 area code but only one phone
       in 917, they will all send from that phone. they will also be
       throttled at 1message per second. not good. so we need to not
       use matching area codes if there are too few to cover our list */
    const suppressedAreaCodes = contactsAreaCodeCounts.reduce(
      (arr, contacts) => {
        const needed = Math.ceil(contacts.count / contactsPerPhoneNumber);
        let { availableCount } =
          phoneNumberCounts.find(
            phones =>
              phones.areaCode === contacts.areaCode && phones.availableCount
          ) || {};

        // if inventory is saved, add that to the available
        const inventory = inventoryCounts.find(
          reserved => reserved.areaCode === contacts.areaCode
        ) || { count: 0 };

        availableCount += inventory.count;

        if (availableCount < needed) arr.push(contacts.areaCode);
        return arr;
      },
      []
    );

    this.setState({
      suppressedAreaCodes,
      showOnlySelected: isStarted
    });
  };

  getTotalNumberCount = numbers =>
    numbers.reduce((total, entry) => total + entry.count, 0);

  getNumbersCount = count => (count === 1 ? "number" : "numbers");

  formSchema = yup.object({
    areaCode: yup.string(), // TODO: validate
    count: yup.number()
  });

  formValues() {
    return {
      ...this.props.formValues,
      inventoryPhoneNumberCounts: this.props.formValues
        .inventoryPhoneNumberCounts
    };
  }

  renderPhoneNumbers() {
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
          overflowY: "auto"
        }}
      >
        {isRendering ? (
          <LoadingIndicator />
        ) : (
          states.map(state => [
            <ListItem
              key={state}
              button
              onClick={() =>
                this.setState({
                  [`${state}-open`]: !this.state[`${state}-open`]
                })
              }
            >
              <ListItemText primary={state} />
              {this.state[`${state}-open`] ? <ExpandLess /> : <ExpandMore />}
            </ListItem>,
            <Collapse
              in={this.state[`${state}-open`]}
              timeout="auto"
              unmountOnExit
              style={{ margin: "0 10px" }}
            >
              <List>
                {areaCodes
                  .filter(areaCode => areaCode.state === state)
                  .map(({ areaCode, availableCount }) => {
                    const assignedCount = getAssignedCount(areaCode);
                    const isSuppressed = suppressedAreaCodes.includes(areaCode);
                    return (
                      <ListItem
                        key={areaCode}
                        style={{
                          marginBottom: 15,
                          border: "1px solid rgb(225, 228, 224)",
                          borderRadius: 8
                        }}
                        disabled
                      >
                        <ListItemText primary={areaCode} />
                        <ListItemSecondaryAction>
                          <span
                            style={{
                              color: isSuppressed
                                ? theme.colors.red
                                : theme.colors.gray
                            }}
                          >
                            {!isStarted && isSuppressed && (
                              <span
                                style={{
                                  marginTop: 15,
                                  marginRight: 10,
                                  color: theme.colors.red,
                                  fontSize: 14
                                }}
                              >
                                Not Enough to Reserve
                              </span>
                            )}
                            {!isStarted && !isSuppressed && (
                              <IconButton
                                disabled={!assignedCount}
                                onClick={() => unassignAreaCode(areaCode)}
                              >
                                <RemoveIcon />
                              </IconButton>
                            )}
                            {assignedCount}{" "}
                            {!isStarted && ` / ${availableCount}`}
                            {!isStarted && !isSuppressed && (
                              <IconButton
                                disabled={
                                  assignedCount === availableCount ||
                                  assignedNumberCount === numbersNeeded
                                }
                                onClick={() => assignAreaCode(areaCode)}
                              >
                                <AddIcon />
                              </IconButton>
                            )}
                          </span>
                        </ListItemSecondaryAction>
                      </ListItem>
                    );
                  })}
              </List>
            </Collapse>
          ])
        )}
      </List>
    );
  }

  renderSubtitle = () => {
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

  renderSearch() {
    const { isStarted, phoneNumberCounts } = this.props;

    if (phoneNumberCounts.length === 0) {
      return (
        <div style={inlineStyles.autocomplete}>No phone numbers available</div>
      );
    }

    const autocomplete = (
      <Autocomplete
        ref="autocomplete"
        style={inlineStyles.autocomplete}
        onInputChange={(event, searchText) => this.setState({ searchText })}
        inputValue={this.state.searchText}
        name="areaCode"
        getOptionLabel={option =>
          `${option.state}: ${option.areaCode} / available: ${option.availableCount}`
        }
        options={phoneNumberCounts}
        renderInput={params => (
          <TextField
            {...params}
            label="Find State or Area Code"
            variant="outlined"
          />
        )}
      />
    );
    const showAutocomplete = !isStarted && phoneNumberCounts.length > 0;
    return <div>{showAutocomplete && autocomplete}</div>;
  }

  renderErrorMessage() {
    const { error } = this.state;
    return <div className={css(styles.errorMessage)}>{error}</div>;
  }

  renderAreaCodeTable() {
    const { inventoryPhoneNumberCounts: reservedNumbers } = this.formValues();
    const assignedNumberCount = this.getTotalNumberCount(reservedNumbers);
    const {
      isStarted,
      inventoryCounts,
      contactsCount,
      contactsAreaCodeCounts,
      contactsPerPhoneNumber
    } = this.props;
    const { isRendering, hasReset } = this.state;
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
              // see NOTE in setSuppressedAreaCodes
              !suppressedAreaCodes.includes(phoneNumber.areaCode)
          )
          .map(phoneNumber => {
            /* until we save and navigate back and props.inventoryCounts
             has values, the phoneNumberCounts will need to have the
             "form state inventory" subtracted from the available count
             UNLESS we've used RESET after saving, then ADD props inventory
            */

            let foundAllocated = inventory.find(
              ({ areaCode }) => areaCode === phoneNumber.areaCode
            ) || { count: 0 };

            if (hasReset) {
              foundAllocated = inventoryCounts.find(
                ({ areaCode }) => areaCode === phoneNumber.areaCode
              ) || { count: 0 };
            }

            const availableCount =
              !inventoryCounts.length && !hasReset
                ? phoneNumber.availableCount - foundAllocated.count
                : hasReset
                ? phoneNumber.availableCount + foundAllocated.count
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
             see NOTE in setSuppressedAreaCodes */
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

    const resetReserved = () => {
      /* eslint-disable no-alert */
      const confirmed = confirm(
        "Are you sure you want to clear your selected phones?"
      );
      if (confirmed) {
        this.props.onChange({ inventoryPhoneNumberCounts: [] });
        this.setState({ hasReset: true, showOnlySelected: false });
      }
    };

    return (
      <div
        className={css(styles.container)}
        style={{ flex: 1, marginRight: 50, maxWidth: 500 }}
      >
        <div className={css(styles.headerContainer)} style={{ height: "auto" }}>
          <div
            style={{
              flex: 1,
              fontSize: 14,
              color: headerColor
            }}
          >
            <div style={{ display: "block", margin: "5px 0 10px 5px" }}>
              Reserved phone numbers:
              {` ${assignedNumberCount}/${numbersNeeded}`}
            </div>
            {!isStarted && (
              <div>
                <Button
                  color="primary"
                  variant="contained"
                  disabled={!remaining || isRendering}
                  onClick={() => {
                    this.setState({ isRendering: true });
                    setTimeout(() => autoAssignRemaining());
                    setTimeout(() => {
                      this.setState({ isRendering: false });
                    }, 500);
                  }}
                >
                  Auto-Reserve Remaining {remaining}
                </Button>

                {!isStarted && (
                  <Button
                    style={{
                      marginLeft: "auto",
                      fontSize: 12,
                      textAlign: "right"
                    }}
                    size="small"
                    color="secondary"
                    variant="contained"
                    disabled={!assignedNumberCount || isRendering}
                    onClick={() => resetReserved()}
                  >
                    Reset
                  </Button>
                )}

                <FormControlLabel
                  label="Only show reserved"
                  labelPlacement="start"
                  control={
                    <Checkbox
                      style={{
                        margin: "5px 5px 0 auto",
                        fontSize: 14,
                        width: "auto"
                      }}
                      disabled={!reservedNumbers.length}
                      checked={this.state.showOnlySelected}
                      onChange={() => {
                        this.setState(({ showOnlySelected }) => ({
                          showOnlySelected: !showOnlySelected,
                          searchText: ""
                        }));
                      }}
                    />
                  }
                />
              </div>
            )}
          </div>
        </div>
        {this.renderPhoneNumbers()}
      </div>
    );
  }

  renderContactsAreaCodesTable() {
    const { isRendering, searchText } = this.state;
    const {
      contactsCount,
      contactsAreaCodeCounts,
      contactsPerPhoneNumber
    } = this.props;

    const areaCodes = _.orderBy(
      contactsAreaCodeCounts,
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
    ).reduce(
      (arr, [state, count]) =>
        // show all states with significant needs
        count / contactsPerPhoneNumber >= 0.5
          ? [
              ...arr,
              {
                state,
                needed: Math.ceil(count / contactsPerPhoneNumber)
              }
            ]
          : arr,
      []
    );

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

    // only display area codes with more than 1% coverage
    let filteredAreaCodes = areaCodes.filter(
      item => (item.count / contactsCount) * 100 >= 1
    );

    if (searchText) {
      if (!isNaN(searchText) && searchText.length <= 3) {
        const foundAreaCode = filteredAreaCodes.find(({ areaCode }) =>
          areaCode.includes(searchText)
        );
        filteredAreaCodes = foundAreaCode ? [foundAreaCode] : [];
      } else if (isNaN(searchText)) {
        filteredAreaCodes = filteredAreaCodes.filter(({ state }) =>
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
            overflowY: "auto"
          }}
        >
          {isRendering ? (
            <LoadingIndicator />
          ) : (
            states.map(({ state, needed: stateNeeded }) => {
              const stateAssigned = getAssignedCount({ state });
              return [
                <ListItem
                  key={state}
                  button
                  onClick={() =>
                    this.setState({
                      [`${state}-open`]: !this.state[`${state}-open`]
                    })
                  }
                >
                  <ListItemText primary={state} />
                  <ListItemSecondaryAction>
                    <span
                      style={{
                        width: 70,
                        fontSize: 14,
                        color:
                          stateAssigned && stateAssigned >= stateNeeded
                            ? theme.colors.green
                            : theme.colors.black
                      }}
                    >
                      {stateAssigned || 0}
                      {" / "}
                      {stateNeeded}
                    </span>
                    {this.state[`${state}-open`] ? (
                      <ExpandLess />
                    ) : (
                      <ExpandMore />
                    )}
                  </ListItemSecondaryAction>
                </ListItem>,
                <Collapse
                  in={this.state[`${state}-open`]}
                  timeout="auto"
                  unmountOnExit
                  style={{ margin: "0 10px" }}
                >
                  <List>
                    {filteredAreaCodes
                      .filter(areaCode => areaCode.state === state)
                      .map(({ areaCode, count }) => {
                        const needed = Math.ceil(
                          count / contactsPerPhoneNumber
                        );
                        const assignedCount = getAssignedCount({ areaCode });
                        return (
                          <ListItem
                            key={areaCode}
                            style={{
                              marginBottom: 15,
                              border: "1px solid rgb(225, 228, 224)",
                              borderRadius: 8
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center"
                              }}
                            >
                              <span style={{ width: 110 }}>{areaCode}</span>
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
                          </ListItem>
                        );
                      })}
                  </List>
                </Collapse>
              ];
            })
          )}
        </List>
      </div>
    );
  }

  render() {
    const { inventoryPhoneNumberCounts: reservedNumbers } = this.formValues();
    const assignedNumberCount = this.getTotalNumberCount(reservedNumbers);
    const { contactsCount, contactsPerPhoneNumber } = this.props;
    const { isRendering } = this.state;
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
          subtitle={this.renderSubtitle()}
        />
        {numbersNeeded <= maxNumbersPerCampaign ? (
          <div>
            {this.renderSearch()}
            {this.state.error && this.renderErrorMessage()}
            <div
              style={{
                display: "flex"
              }}
            >
              {this.renderAreaCodeTable()}
              {this.renderContactsAreaCodesTable()}
            </div>

            <Form.Submit
              as={GSSubmitButton}
              disabled={
                this.props.saveDisabled ||
                assignedNumberCount !== numbersNeeded ||
                isRendering
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
