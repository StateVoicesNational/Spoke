import type from "prop-types";
import React from "react";
import orderBy from "lodash/orderBy";
import { compose } from "recompose";
import Slider from "./Slider";

import Autocomplete from "@material-ui/lab/Autocomplete";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import DeleteIcon from "@material-ui/icons/Delete";
import CloseIcon from "@material-ui/icons/Close";
import IconButton from "@material-ui/core/IconButton";
import Snackbar from "@material-ui/core/Snackbar";

import Switch from "@material-ui/core/Switch";
import FormControlLabel from "@material-ui/core/FormControlLabel";

import withMuiTheme from "./../containers/hoc/withMuiTheme";
import GSForm from "../components/forms/GSForm";
import GSTextField from "./forms/GSTextField";
import GSSubmitButton from "./forms/GSSubmitButton";
import * as yup from "yup";
import Form from "react-formal";
import CampaignFormSectionHeading from "./CampaignFormSectionHeading";
import { StyleSheet, css } from "aphrodite";
import theme from "../styles/theme";
import { dataTest } from "../lib/attributes";
import { getHighestRole } from "../lib/permissions";

const styles = StyleSheet.create({
  sliderContainer: {
    border: `1px solid`,
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
    flex: "1 1 50%",
    textAlign: "right"
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
    borderBottom: `1px solid`,
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
    display: "inline-block"
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
    marginBottom: 24,
    width: 250
  },
  radioButtonGroup: {
    marginBottom: 12
  },
  header: {
    ...theme.text.header
  }
};

class CampaignTextersForm extends React.Component {
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
      .filter(orgTexter => getHighestRole(orgTexter.roles) !== "SUSPENDED");

    const autocomplete = (
      <Autocomplete
        {...dataTest("texterSearch")}
        autoFocus
        getOptionLabel={({ displayName }) => displayName}
        style={inlineStyles.autocomplete}
        options={dataSource}
        renderInput={params => {
          return <TextField {...params} label="Search for texters to assign" />;
        }}
        onChange={(event, value) => {
          // If you're searching but get no match, value is a string
          // representing your search term, but we only want to handle matches
          if (typeof value === "object" && value !== null) {
            const texterId = value.id;
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
    return <div>{orgTexters.length > 0 ? autocomplete : null}</div>;
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
              color={this.props.muiTheme.palette.text.secondary}
              direction={1}
            />
          </div>
          <div className={css(styles.assignedCount)}>{messagedCount}</div>
          <div {...dataTest("texterName")} className={css(styles.nameColumn)}>
            {this.getDisplayName(texter.id)}
          </div>
          <div className={css(styles.input)}>
            <Form.Field
              as={GSTextField}
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
              color={this.props.muiTheme.palette.primary.main}
              direction={0}
            />
          </div>
          {this.props.useDynamicAssignment ? (
            <div className={css(styles.input)}>
              <Form.Field
                as={GSTextField}
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
          ) : null}
          <div className={css(styles.removeButton)}>
            <IconButton
              onClick={async () => {
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
        ? this.props.muiTheme.palette.primary.main
        : this.props.muiTheme.palette.error.main;
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
                <FormControlLabel
                  label="Split assignments"
                  labelPlacement="start"
                  control={
                    <Switch
                      {...dataTest("autoSplit")}
                      style={{
                        width: "auto",
                        marginLeft: "auto"
                      }}
                      color="primary"
                      checked={this.state.autoSplit}
                      onChange={() => {
                        this.setState(
                          { autoSplit: !this.state.autoSplit },
                          () => {
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
                          }
                        );
                      }}
                    />
                  }
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
          <Form.Submit
            as={GSSubmitButton}
            label={this.props.saveLabel}
            disabled={this.props.saveDisabled}
            {...dataTest("submitCampaignTextersForm")}
          />
        </GSForm>
        <Snackbar
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "center"
          }}
          open={this.state.snackbarOpen}
          autoHideDuration={3000}
          onClose={this.handleSnackbarClose}
          message={this.state.snackbarMessage}
          action={
            <React.Fragment>
              <IconButton
                size="small"
                aria-label="close"
                color="inherit"
                onClick={this.handleSnackbarClose}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </React.Fragment>
          }
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

export default compose(withMuiTheme)(CampaignTextersForm);
