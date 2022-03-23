/* eslint no-console: 0 */
import PropTypes from "prop-types";
import React from "react";
import Form from "react-formal";
import * as yup from "yup";
import GSForm from "../../../components/forms/GSForm";
import GSTextField from "../../../components/forms/GSTextField";
import GSSubmitButton from "../../../components/forms/GSSubmitButton";

import Button from "@material-ui/core/Button";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import ListItemText from "@material-ui/core/ListItemText";
import Divider from "@material-ui/core/Divider";
import DeleteIcon from "@material-ui/icons/Delete";
import CreateIcon from "@material-ui/icons/Create";
import IconButton from "@material-ui/core/IconButton";

import FormHelperText from "@material-ui/core/FormHelperText";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";

import { css } from "aphrodite";

export class OrgConfig extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      accountId: "",
      accounts: this.props.serviceManagerInfo.data.multiTwilio || [],
      formButtonText: "",
      saveDisabled: true,
      showForm: false
    };
  }

  componentDidUpdate(previousProps, prevState) {
    if (
      JSON.stringify(prevState.accounts) != JSON.stringify(this.state.accounts)
    ) {
      // Allow user to save after making account changes
      this.setState({
        saveDisabled: false
      });
    }
  }

  showAddButton() {
    if (!this.state.showForm) {
      return (
        <div>
          <Button
            color="secondary"
            startIcon={<CreateIcon color="secondary" />}
            onClick={() =>
              this.setState({
                accountId: null,
                showForm: true,
                formButtonText: "Add account"
              })
            }
          >
            Add new account
          </Button>
        </div>
      );
    }
  }

  showAddForm() {
    const handleCloseAddForm = () => {
      this.setState({
        showForm: false
      });
    };

    if (this.state.showForm) {
      const modelSchema = yup.object({
        friendlyName: yup.string().required(),
        accountSid: yup.string().required(),
        authToken: yup.string().required(),
        messageServiceSids: yup.string().required()
      });

      return (
        <div
          className={css(this.props.styles.formContainer)}
          style={{
            marginTop: 15
          }}
        >
          <div className={css(this.props.styles.form)}>
            <GSForm
              ref={this.form}
              schema={modelSchema}
              onSubmit={x => {
                // The GSForm component will be unmounted when the showForm state is set to false. Since setState is an asynchronous function, GSForm ends up being unmounted before the setState function finishes. This leads to the following warning being printed to the console: "Warning: Can't perform a React state update on an unmounted component." setTimeout is a workaround to avoid this warning. This workaround was borrowed from the showAddForm() method in src/components/CampaignCannedResponsesForm.jsx. We can strive to find a better solution in the future.
                setTimeout(() => {
                  if (this.state.accountId) {
                    // Edit account
                    x.id = this.state.accountId;
                    this.setState({
                      accounts: this.state.accounts.map(account => {
                        if (account.id == this.state.accountId) {
                          return x;
                        }
                        return account;
                      }),
                      showForm: false
                    });
                  } else {
                    // New account
                    x.id = this.state.accounts.length
                      ? this.state.accounts.at(-1).id + 1
                      : 1;
                    this.setState(prevState => ({
                      accounts: [...prevState.accounts, x],
                      showForm: false
                    }));
                  }
                }, 0);
              }}
              defaultValue={
                this.state.accounts.find(
                  res => res.id === this.state.accountId
                ) || {
                  accountSid: "",
                  authToken: "",
                  friendlyName: "",
                  messageServiceSids: ""
                }
              }
            >
              <Form.Field
                as={GSTextField}
                label="Friendly Name"
                name="friendlyName"
                fullWidth
              />
              <Form.Field
                as={GSTextField}
                label="Account SID"
                name="accountSid"
                fullWidth
              />
              <Form.Field
                as={GSTextField}
                label="Auth Token"
                name="authToken"
                fullWidth
              />
              <Form.Field
                as={GSTextField}
                label="Message Service SID(s)"
                name="messageServiceSids"
                fullWidth
              />
              <div className={css(this.props.styles.buttonRow)}>
                <Form.Submit
                  as={GSSubmitButton}
                  label={this.state.formButtonText}
                  className={css(this.props.styles.button)}
                />
                <Button variant="contained" onClick={handleCloseAddForm}>
                  Cancel
                </Button>
              </div>
            </GSForm>
          </div>
        </div>
      );
    }
  }

  listItems(accounts) {
    const listItems = accounts.map(account => (
      <ListItem key={account.id}>
        <ListItemText>
          <div className={css(this.props.styles.title)}>
            {account.friendlyName}
          </div>
        </ListItemText>
        <ListItemSecondaryAction>
          <IconButton
            onClick={() =>
              this.setState({
                accountId: account.id,
                showForm: true,
                formButtonText: "Edit Account"
              })
            }
          >
            <CreateIcon />
          </IconButton>
          <IconButton
            onClick={() => {
              this.setState({
                accounts: this.state.accounts
                  .map(accountToDelete => {
                    if (accountToDelete.id === account.id) {
                      return null;
                    }
                    return accountToDelete;
                  })
                  .filter(ele => ele !== null)
              });
            }}
          >
            <DeleteIcon />
          </IconButton>
        </ListItemSecondaryAction>
      </ListItem>
    ));
    return listItems;
  }

  render() {
    const accounts = this.state.accounts;
    const list =
      !accounts || accounts.length === 0 ? null : (
        <List>
          {this.listItems(accounts)}
          <Divider />
        </List>
      );

    return (
      <div>
        <GSForm
          onSubmit={() => {
            this.props.onSubmit(this.state.accounts);
            this.setState({
              saveDisabled: true
            });
          }}
        >
          {list}
          {this.showAddButton()}
          <Form.Submit
            as={GSSubmitButton}
            disabled={this.state.saveDisabled}
            label="Save"
            style={this.props.inlineStyles.dialogButton}
          />
        </GSForm>
        {this.showAddForm()}
      </div>
    );
  }
}

OrgConfig.propTypes = {
  serviceManagerInfo: PropTypes.object,
  inlineStyles: PropTypes.object,
  styles: PropTypes.object,
  onSubmit: PropTypes.func
};

export class CampaignConfig extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      campaignTwilioAccountId:
        this.props.serviceManagerInfo.data.campaignTwilioAccount.id || "",
      hasError: false,
      saveDisabled: true
    };
  }

  render() {
    return (
      <div>
        {!this.props.campaign.isStarted ? (
          <div>
            Select the Twilio account to use for this campaign.
            <GSForm
              onSubmit={() => {
                this.setState({
                  hasError: !Number.isInteger(
                    this.state.campaignTwilioAccountId
                  )
                });
                if (!this.state.hasError) {
                  this.props.onSubmit(
                    this.props.serviceManagerInfo.data.multiTwilio.find(
                      account => {
                        return account.id == this.state.campaignTwilioAccountId;
                      }
                    ).id
                  );
                  this.setState({
                    saveDisabled: true
                  });
                }
              }}
            >
              <Select
                error={this.state.hasError}
                name="twilioAccount"
                value={this.state.campaignTwilioAccountId}
                onChange={event => {
                  this.setState({
                    campaignTwilioAccountId: event.target.value,
                    saveDisabled: false
                  });
                }}
                fullWidth
              >
                {this.props.serviceManagerInfo.data.multiTwilio.map(account => (
                  <MenuItem key={account.id} value={account.id}>
                    {account.friendlyName}
                  </MenuItem>
                ))}
              </Select>
              {this.state.hasError && (
                <FormHelperText>
                  Twilio Account is a required field
                </FormHelperText>
              )}
              <Form.Submit
                as={GSSubmitButton}
                disabled={this.state.saveDisabled}
                label="Save"
              />
            </GSForm>
          </div>
        ) : (
          <div>
            Twilio account used for this campaign:{" "}
            {
              this.props.serviceManagerInfo.data.campaignTwilioAccount
                .friendlyName
            }
          </div>
        )}
      </div>
    );
  }
}

CampaignConfig.propTypes = {
  user: PropTypes.object,
  campaign: PropTypes.object,
  serviceManagerInfo: PropTypes.object,
  saveLabel: PropTypes.string,
  onSubmit: PropTypes.func
};
