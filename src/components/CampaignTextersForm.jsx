import type from "prop-types";
import React from "react";
import orderBy from "lodash/orderBy";
import Slider from "./Slider";
import AutoComplete from "material-ui/AutoComplete";
import IconButton from "material-ui/IconButton";
import RaisedButton from "material-ui/RaisedButton";
import Snackbar from "material-ui/Snackbar";
import GSForm from "../components/forms/GSForm";
import yup from "yup";
import Form from "react-formal";
import CampaignFormSectionHeading from "./CampaignFormSectionHeading";
import { StyleSheet, css } from "aphrodite";
import theme from "../styles/theme";
import Toggle from "material-ui/Toggle";
import DeleteIcon from "material-ui/svg-icons/action/delete";
import { dataTest } from "../lib/attributes";
import { dataSourceItem } from "./utils";
import { getHighestRole } from "../lib/permissions";

const styles = StyleSheet.create({
  sliderContainer: {
    border: `1px solid ${theme.colors.lightGray}`,
    padding: 10,
    borderRadius: 8
  },
  removeButton: {
    width: 50
  },
  texterRow: {
    display: "flex",
    flexDirection: "row"
  },
  alreadyTextedHeader: {
    textAlign: "right",
    fontWeight: 600,
    fontSize: 16
  },
  availableHeader: {
    fontWeight: 600,
    fontSize: 16
  },
  nameColumn: {
    width: 100,
    textOverflow: "ellipsis",
    marginTop: "auto",
    marginBottom: "auto",
    paddingRight: 10
  },
  splitToggle: {
    ...theme.text.body,
    flex: "1 1 50%"
  },
  slider: {
    flex: "1 1 35%",
    marginTop: "auto",
    marginBottom: "auto",
    paddingRight: 10
  },
  leftSlider: {
    flex: "1 1 35%",
    marginTop: "auto",
    marginBottom: "auto",
    paddingRight: 10
  },
  headerContainer: {
    display: "flex",
    borderBottom: `1px solid ${theme.colors.lightGray}`,
    marginBottom: 20
  },
  assignedCount: {
    width: 40,
    fontSize: 16,
    paddingLeft: 5,
    paddingRight: 5,
    textAlign: "center",
    marginTop: "auto",
    marginBottom: "auto",
    marginRight: 10,
    display: "inline-block",
    backgroundColor: theme.colors.lightGray
  },
  input: {
    width: 50,
    paddingLeft: 0,
    paddingRight: 0,
    marginRight: 10,
    marginTop: "auto",
    marginBottom: "auto",
    display: "inline-block"
  }
});

const inlineStyles = {
  autocomplete: {
    marginBottom: 24
  },
  radioButtonGroup: {
    marginBottom: 12
  },
  header: {
    ...theme.text.header
  }
};

export default class CampaignTextersForm extends React.Component {
  state = {
    autoSplit: false,
    focusedTexterId: null,
    snackbarOpen: false,
    snackbarMessage: ""
  };

  onChange = formValues => {
    const existingFormValues = this.formValues();
    const changedTexterId = this.state.focusedTexterId;
    const newFormValues = {
      ...formValues
    };
    let totalNeedsMessage = 0;
    let totalMessaged = 0;
    const texterCountChanged =
      newFormValues.texters.length !== existingFormValues.texters.length;

    // 1. map form texters to existing texters. with needsMessageCount tweaked to minimums when invalid or useless
    newFormValues.texters = newFormValues.texters.map(newTexter => {
      const existingTexter = existingFormValues.texters.filter(texter =>
        texter.id === newTexter.id ? texter : null
      )[0];
      let messagedCount = 0;
      if (existingTexter) {
        messagedCount =
          existingTexter.assignment.contactsCount -
          existingTexter.assignment.needsMessageCount;
        totalMessaged += messagedCount;
      }

      let convertedNeedsMessageCount = parseInt(
        newTexter.assignment.needsMessageCount,
        10
      );
      let convertedMaxContacts = !!newTexter.assignment.maxContacts
        ? parseInt(newTexter.assignment.maxContacts)
        : null;

      if (isNaN(convertedNeedsMessageCount)) {
        convertedNeedsMessageCount = 0;
      }
      if (
        convertedNeedsMessageCount + messagedCount >
        this.formValues().contactsCount
      ) {
        convertedNeedsMessageCount =
          this.formValues().contactsCount - messagedCount;
      }

      if (convertedNeedsMessageCount < 0) {
        convertedNeedsMessageCount = 0;
      }

      if (texterCountChanged && this.state.autoSplit) {
        convertedNeedsMessageCount = 0;
      }

      totalNeedsMessage = totalNeedsMessage + convertedNeedsMessageCount;

      return {
        ...newTexter,
        assignment: {
          ...newTexter.assignment,
          contactsCount: convertedNeedsMessageCount + messagedCount,
          messagedCount,
          needsMessageCount: convertedNeedsMessageCount,
          maxContacts: convertedMaxContacts
        }
      };
    });

    // extraTexterCapacity is the number of contacts assigned to texters in excess of the
    // total number of contacts available
    let extraTexterCapacity =
      totalNeedsMessage + totalMessaged - this.formValues().contactsCount;

    if (extraTexterCapacity > 0) {
      // 2. If extraTexterCapacity > 0, reduce the user's input to the number of contacts available
      // for assignment
      newFormValues.texters = newFormValues.texters.map(newTexter => {
        if (newTexter.id === changedTexterId) {
          const returnTexter = newTexter;
          returnTexter.assignment.needsMessageCount -= extraTexterCapacity;
          returnTexter.assignment.contactsCount -= extraTexterCapacity;
          return returnTexter;
        }
        return newTexter;
      });
      const focusedTexter = newFormValues.texters.find(texter => {
        return texter.id === changedTexterId;
      });
      this.setState({
        snackbarOpen: true,
        snackbarMessage: `${focusedTexter.assignment.contactsCount} contact${
          focusedTexter.assignment.contactsCount === 1 ? "" : "s"
        } assigned to ${this.getDisplayName(focusedTexter.id)}`
      });
    } else if (this.state.autoSplit) {
      // 3. if we don't have extraTexterCapacity and auto-split is on, then fill the texters with assignments
      const factor = 1;
      let index = 0;
      let skipsByIndex = new Array(newFormValues.texters.length).fill(0);
      if (newFormValues.texters.length === 1) {
        const messagedCount =
          newFormValues.texters[0].assignment.contactsCount -
          newFormValues.texters[0].assignment.needsMessageCount;
        newFormValues.texters[0].assignment.contactsCount = this.formValues().contactsCount;
        newFormValues.texters[0].assignment.needsMessageCount =
          this.formValues().contactsCount - messagedCount;
      } else if (newFormValues.texters.length > 1) {
        while (extraTexterCapacity < 0) {
          const texter = newFormValues.texters[index];
          if (
            skipsByIndex[index] <
            texter.assignment.contactsCount -
              texter.assignment.needsMessageCount
          ) {
            skipsByIndex[index]++;
          } else {
            if (!changedTexterId || texter.id !== changedTexterId) {
              if (texter.assignment.needsMessageCount + factor >= 0) {
                texter.assignment.needsMessageCount =
                  texter.assignment.needsMessageCount + factor;
                texter.assignment.contactsCount =
                  texter.assignment.contactsCount + factor;
                extraTexterCapacity = extraTexterCapacity + factor;
              }
            }
          }
          index = index + 1;
          if (index >= newFormValues.texters.length) {
            index = 0;
          }
        }
      }
    }

    this.props.onChange(newFormValues);
  };

  formSchema = yup.object({
    texters: yup.array().of(
      yup.object({
        id: yup.string(),
        assignment: yup.object({
          needsMessageCount: yup.string(),
          maxContacts: yup.string().nullable()
        })
      })
    )
  });

  formValues() {
    const unorderedTexters = this.props.formValues.texters;
    return {
      ...this.props.formValues,
      texters: orderBy(
        unorderedTexters,
        ["firstName", "lastName"],
        ["asc", "asc"]
      )
    };
  }

  showSearch() {
    const { orgTexters } = this.props;
    const { texters } = this.formValues();

    const dataSource = orgTexters
      .filter(orgTexter => !texters.find(texter => texter.id === orgTexter.id))
      .filter(orgTexter => getHighestRole(orgTexter.roles) !== "SUSPENDED")
      .map(orgTexter => dataSourceItem(orgTexter.displayName, orgTexter.id));

    const filter = (searchText, key) =>
      key === "allTexters"
        ? true
        : AutoComplete.caseInsensitiveFilter(searchText, key);

    const autocomplete = (
      <AutoComplete
        ref="autocomplete"
        style={inlineStyles.autocomplete}
        autoFocus
        onFocus={() => this.setState({ searchText: "" })}
        onUpdateInput={searchText => this.setState({ searchText })}
        searchText={this.state.searchText}
        filter={filter}
        hintText="Search for texters to assign"
        dataSource={dataSource}
        {...dataTest("texterSearch")}
        onNewRequest={value => {
          // If you're searching but get no match, value is a string
          // representing your search term, but we only want to handle matches
          if (typeof value === "object") {
            const texterId = value.value.key;
            const newTexter = this.props.orgTexters.find(
              texter => texter.id === texterId
            );
            this.onChange({
              texters: [
                ...this.formValues().texters,
                {
                  id: texterId,
                  firstName: newTexter.firstName,
                  assignment: {
                    contactsCount: 0,
                    needsMessageCount: 0
                  }
                }
              ]
            });
          }
        }}
      />
    );

    return <div>{orgTexters.length > 0 ? autocomplete : ""}</div>;
  }

  addAllTexters() {
    const { orgTexters } = this.props;

    const textersToAdd = orgTexters.map(orgTexter => {
      const id = orgTexter.id;
      const firstName = orgTexter.firstName;
      return {
        id,
        firstName,
        assignment: {
          contactsCount: 0,
          needsMessageCount: 0
        }
      };
    });

    this.onChange({ texters: textersToAdd });
  }

  getDisplayName(texterId) {
    const texterObj = this.props.orgTexters.find(o => o.id === texterId);
    const suffix =
      getHighestRole(texterObj.roles) === "SUSPENDED" ? " (Suspended)" : "";
    return texterObj.displayName + suffix;
  }

  showTexters() {
    return this.formValues().texters.map((texter, index) => {
      const messagedCount =
        texter.assignment.contactsCount - texter.assignment.needsMessageCount;
      return (
        <div
          {...dataTest("texterRow")}
          key={texter.id}
          className={css(styles.texterRow)}
        >
          <div className={css(styles.leftSlider)}>
            <Slider
              maxValue={this.formValues().contactsCount}
              value={messagedCount}
              color={theme.colors.darkGray}
              direction={1}
            />
          </div>
          <div className={css(styles.assignedCount)}>{messagedCount}</div>
          <div {...dataTest("texterName")} className={css(styles.nameColumn)}>
            {this.getDisplayName(texter.id)}
          </div>
          <div className={css(styles.input)}>
            <Form.Field
              {...dataTest("texterAssignment")}
              name={`texters[${index}].assignment.needsMessageCount`}
              hintText="Contacts"
              fullWidth
              onFocus={() => this.setState({ focusedTexterId: texter.id })}
              onBlur={() =>
                this.setState({
                  focusedTexterId: null
                })
              }
            />
          </div>
          <div className={css(styles.slider)}>
            <Slider
              maxValue={this.formValues().contactsCount}
              value={texter.assignment.needsMessageCount}
              color={theme.colors.green}
              direction={0}
            />
          </div>
          {this.props.useDynamicAssignment ? (
            <div className={css(styles.input)}>
              <Form.Field
                name={`texters[${index}].assignment.maxContacts`}
                hintText="Max"
                fullWidth
                onFocus={() => this.setState({ focusedTexterId: texter.id })}
                onBlur={() =>
                  this.setState({
                    focusedTexterId: null
                  })
                }
              />
            </div>
          ) : (
            ""
          )}
          <div className={css(styles.removeButton)}>
            <IconButton
              onTouchTap={async () => {
                const currentFormValues = this.formValues();
                const newFormValues = {
                  ...currentFormValues
                };
                newFormValues.texters = newFormValues.texters.slice();
                if (messagedCount === 0) {
                  newFormValues.texters.splice(index, 1);
                } else {
                  await this.setState({ focusedTexterId: texter.id });
                  newFormValues.texters[index] = {
                    ...texter,
                    assignment: {
                      needsMessageCount: 0
                    }
                  };
                }
                this.onChange(newFormValues);
              }}
            >
              <DeleteIcon />
            </IconButton>
          </div>
        </div>
      );
    });
  }

  handleSnackbarClose = () => {
    this.setState({ snackbarOpen: false, snackbarMessage: "" });
  };

  render() {
    const { organizationUuid, campaignId } = this.props;
    const assignedContacts = this.formValues().texters.reduce(
      (prev, texter) => prev + texter.assignment.contactsCount,
      0
    );

    const headerColor =
      assignedContacts === this.formValues().contactsCount
        ? theme.colors.green
        : theme.colors.orange;
    return (
      <div>
        <CampaignFormSectionHeading
          title="Who should send the texts?"
          subtitle={"Also see Dynamic Assignment Panel, below."}
        />
        <GSForm
          schema={this.formSchema}
          value={this.formValues()}
          onChange={this.onChange}
          onSubmit={this.props.onSubmit}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {this.showSearch()}
            <div>
              <RaisedButton
                {...dataTest("addAll")}
                label="Add All"
                onTouchTap={() => this.addAllTexters()}
              />
            </div>
          </div>
          <div className={css(styles.sliderContainer)}>
            <div className={css(styles.headerContainer)}>
              <div
                style={{
                  ...inlineStyles.header,
                  color: headerColor,
                  flex: "1 1 50%"
                }}
              >
                {`Assigned contacts: ${assignedContacts}/${
                  this.formValues().contactsCount
                }`}
              </div>
              <div className={css(styles.splitToggle)}>
                <Toggle
                  {...dataTest("autoSplit")}
                  label="Split assignments"
                  style={{
                    width: "auto",
                    marginLeft: "auto"
                  }}
                  toggled={this.state.autoSplit}
                  onToggle={() => {
                    this.setState({ autoSplit: !this.state.autoSplit }, () => {
                      if (this.state.autoSplit) {
                        const contactsCount = Math.floor(
                          this.formValues().contactsCount /
                            this.formValues().texters.length
                        );
                        const newTexters = this.formValues().texters.map(
                          texter => ({
                            ...texter,
                            assignment: {
                              ...texter.assignment,
                              contactsCount
                            }
                          })
                        );
                        this.onChange({
                          ...this.formValues(),
                          texters: newTexters
                        });
                      }
                    });
                  }}
                />
              </div>
            </div>
            <div className={css(styles.texterRow)}>
              <div
                className={css(styles.leftSlider, styles.alreadyTextedHeader)}
              >
                Already texted
              </div>
              <div className={css(styles.assignedCount)}></div>
              <div className={css(styles.nameColumn)}></div>
              <div className={css(styles.input)}></div>
              <div className={css(styles.slider, styles.availableHeader)}>
                Available to assign
              </div>
              <div className={css(styles.removeButton)}></div>
            </div>
            {this.showTexters()}
          </div>
          <Form.Button
            type="submit"
            label={this.props.saveLabel}
            disabled={this.props.saveDisabled}
            {...dataTest("submitCampaignTextersForm")}
          />
        </GSForm>
        <Snackbar
          open={this.state.snackbarOpen}
          message={this.state.snackbarMessage}
          autoHideDuration={3000}
          onRequestClose={this.handleSnackbarClose}
        />
      </div>
    );
  }
}

CampaignTextersForm.propTypes = {
  onChange: type.func,
  orgTexters: type.array,
  ensureComplete: type.bool,
  organizationId: type.string,
  formValues: type.object,
  contactsCount: type.number,
  useDynamicAssignment: type.bool,
  onSubmit: type.func,
  saveLabel: type.string,
  saveDisabled: type.bool
};
