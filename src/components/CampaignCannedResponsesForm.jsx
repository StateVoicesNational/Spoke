import type from "prop-types";
import React from "react";
import CampaignCannedResponseForm from "./CampaignCannedResponseForm";
import Form from "react-formal";
import * as yup from "yup";
import GSSubmitButton from "./forms/GSSubmitButton";

import Button from "@material-ui/core/Button";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import ListItemText from "@material-ui/core/ListItemText";
import Divider from "@material-ui/core/Divider";
import DeleteIcon from "@material-ui/icons/Delete";
import CreateIcon from "@material-ui/icons/Create";
import PublishIcon from "@material-ui/icons/Publish";
import ClearIcon from "@material-ui/icons/Clear";
import IconButton from "@material-ui/core/IconButton";
import Tooltip from "@material-ui/core/Tooltip";

import GSForm from "./forms/GSForm";
import CampaignFormSectionHeading from "./CampaignFormSectionHeading";
import theme from "../styles/theme";
import { StyleSheet, css } from "aphrodite";
import { dataTest } from "../lib/attributes";
import loadData from "../containers/hoc/load-data";
import { gql } from "@apollo/client";
import TagChips from "./TagChips";
import { parseCannedResponseCsv } from "../lib/parse_csv";

const Span = ({ children }) => <span>{children}</span>;

export class CampaignCannedResponsesForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      showForm: false,
      formButtonText: "",
      responseId: null,
      showFullTextId: null,
      uploadingCsv: false,
      uploadCsvError: null,
      availableActionsLookup:
        props.availableActions &&
        props.availableActions.reduce((lookup, action) => {
          const toReturn = { ...lookup };
          toReturn[action.name] = action;
          return toReturn;
        }, {})
    };

    this.styles = StyleSheet.create({
      formContainer: {
        ...theme.layouts.greenBox,
        maxWidth: "100%",
        paddingTop: 10,
        paddingBottom: 10,
        paddingRight: 10,
        paddingLeft: 10,
        marginTop: 15,
        textAlign: "left"
      },
      form: {
        padding: 10
      },
      title: {
        marginBottom: 8
      },
      text: {
        fontSize: 14,
        marginBottom: 8,
        display: "-webkit-box",
        WebkitBoxOrient: "vertical",
        WebkitLineClamp: 2,
        overflow: "hidden",
        height: 32,
        width: "90%"
      },
      redText: {
        color: this.props.muiTheme.palette.error.main
      },
      spaceBetween: {
        display: "flex",
        justifyContent: "space-between"
      },
      flexEnd: {
        display: "flex",
        justifyContent: "flex-end"
      }
    });
  }

  formSchema = yup.object({
    cannedResponses: yup.array().of(
      yup.object({
        title: yup.string(),
        text: yup.string()
      })
    )
  });

  getCannedResponseId() {
    return Math.random()
      .toString(36)
      .replace(/[^a-zA-Z1-9]+/g, "");
  }

  showAddButton(cannedResponses) {
    this.uploadCsvInputRef = React.createRef();

    if (!this.state.showForm) {
      return (
        <div className={css(this.styles.spaceBetween)}>
          <Button
            variant="outlined"
            startIcon={<CreateIcon color="primary" />}
            onClick={() =>
              this.setState({
                showForm: true,
                responseId: null,
                formButtonText: "Add Response"
              })
            }
          >
            Add new canned response
          </Button>
          <div>
            <div className={css(this.styles.flexEnd)}>
              <Tooltip title="Upload a CSV of canned responses with columns for Title, Text, Action, ActionData, and Tags">
                <IconButton
                  onClick={() => this.uploadCsvInputRef.current.click()}
                  disabled={this.state.uploadingCsv}
                >
                  <PublishIcon />
                </IconButton>
              </Tooltip>
              {cannedResponses.length ? (
                <Tooltip title="Remove all canned responses">
                  <IconButton
                    onClick={() =>
                      this.props.onChange({
                        cannedResponses: []
                      })
                    }
                  >
                    <ClearIcon />
                  </IconButton>
                </Tooltip>
              ) : (
                ""
              )}
            </div>
            <input
              type="file"
              accept=".csv"
              ref={this.uploadCsvInputRef}
              onChange={this.handleCsvUpload}
              onClick={e => (e.target.value = null)}
              style={{ display: "none" }}
            />
            {this.state.uploadCsvError && (
              <div className={css(this.styles.redText)}>
                {this.state.uploadCsvError}
              </div>
            )}
          </div>
        </div>
      );
    }
  }

  showAddForm() {
    const handleCloseAddForm = () => {
      this.setState({ showForm: false });
    };

    if (this.state.showForm) {
      return (
        <div className={css(this.styles.formContainer)}>
          <div className={css(this.styles.form)}>
            <CampaignCannedResponseForm
              defaultValue={
                this.props.formValues.cannedResponses.find(
                  res => res.id === this.state.responseId
                ) || { text: "", title: "" }
              }
              formButtonText={this.state.formButtonText}
              handleCloseAddForm={handleCloseAddForm}
              onSaveCannedResponse={ele => {
                const newVals = this.props.formValues.cannedResponses.slice(0);
                const newEle = {
                  ...ele
                };
                if (!this.state.responseId) {
                  newEle.id = this.getCannedResponseId();
                  newVals.push(newEle);
                } else {
                  const resToEditIndex = newVals.findIndex(
                    res => res.id === this.state.responseId
                  );
                  newVals[resToEditIndex] = newEle;
                }
                this.props.onChange({
                  cannedResponses: newVals
                });

                // FIXME: this timeout shouldn't be needed
                setTimeout(() => {
                  this.setState({ showForm: false });
                }, 10);
              }}
              customFields={this.props.customFields}
              tags={this.props.data.organization.tags}
              availableActions={this.props.availableActions}
              muiTheme={this.props.muiTheme}
            />
          </div>
        </div>
      );
    }
  }

  listItems(cannedResponses) {
    const { availableActionsLookup } = this.state;
    const listItems = cannedResponses.map(response => (
      <ListItem
        {...dataTest("cannedResponse")}
        value={response.text}
        key={response.id}
      >
        <ListItemText
          onClick={() =>
            this.setState({
              showFullTextId:
                this.state.showFullTextId === response.id ? null : response.id
            })
          }
        >
          <div className={css(this.styles.title)}>{response.title}</div>
          <div
            className={css(this.styles.text)}
            style={
              this.state.showFullTextId === response.id
                ? {}
                : {
                    WebkitLineClamp: 2,
                    overflow: "hidden"
                  }
            }
          >
            {response.answerActions ? (
              <span>
                Action: &nbsp;
                {availableActionsLookup[response.answerActions].displayName}
                &nbsp;{JSON.parse(response.answerActionsData || "{}").label}
                <br />
              </span>
            ) : null}
            <span>{response.text}</span>
          </div>
          {response.tagIds && response.tagIds.length > 0 && (
            <TagChips
              tags={this.props.data.organization.tags}
              tagIds={response.tagIds}
            />
          )}
        </ListItemText>
        <ListItemSecondaryAction>
          <IconButton
            onClick={() =>
              this.setState({
                showForm: true,
                responseId: response.id,
                formButtonText: "Edit Response"
              })
            }
          >
            <CreateIcon />
          </IconButton>
          <IconButton
            onClick={() => {
              const newVals = this.props.formValues.cannedResponses
                .map(responseToDelete => {
                  if (responseToDelete.id === response.id) {
                    return null;
                  }
                  return responseToDelete;
                })
                .filter(ele => ele !== null);

              this.props.onChange({
                cannedResponses: newVals
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

  handleCsvUpload = event => {
    event.preventDefault();

    const file = event.target.files[0];
    const tags = this.props.data.organization.tags;
    const availableActions = this.props.availableActions;

    if (!file) return;

    this.setState({ uploadingCsv: true, uploadCsvError: null }, () =>
      parseCannedResponseCsv(
        file,
        availableActions,
        tags,
        ({ error, cannedResponses }) => {
          this.setState({
            uploadingCsv: false,
            uploadCsvError: error
          });

          if (error) return;

          this.props.onChange({
            cannedResponses: [
              ...this.props.formValues.cannedResponses,
              ...cannedResponses.map(r => ({
                ...r,
                id: this.getCannedResponseId()
              }))
            ]
          });
        }
      )
    );
  };

  render() {
    const { formValues } = this.props;
    const cannedResponses = formValues.cannedResponses;
    const list =
      cannedResponses.length === 0 ? null : (
        <List>
          {this.listItems(cannedResponses)}
          <Divider />
        </List>
      );

    const sectionSubtitle = global.HIDE_BRANCHED_SCRIPTS
      ? "Save some scripts for your texters to use to continue the conversation with your contact."
      : "Save some scripts for your texters to use to answer additional FAQs that may come up outside of the survey questions and scripts you already set up.";
    return (
      <React.Fragment>
        <GSForm
          schema={this.formSchema}
          value={formValues}
          onChange={change => {
            this.props.onChange(change);
          }}
          onSubmit={this.props.onSubmit}
        >
          <CampaignFormSectionHeading
            title="Canned responses for texters"
            subtitle={sectionSubtitle}
          />
          {list}
          {this.showAddButton(cannedResponses)}
          <Form.Submit
            as={GSSubmitButton}
            disabled={this.props.saveDisabled}
            label={this.props.saveLabel}
          />
        </GSForm>
        {this.showAddForm()}
      </React.Fragment>
    );
  }
}

CampaignCannedResponsesForm.propTypes = {
  saveLabel: type.string,
  saveDisabled: type.bool,
  onSubmit: type.func,
  onChange: type.func,
  formValues: type.object,
  customFields: type.array,
  organizationId: type.string,
  data: type.object,
  availableActions: type.array
};

const queries = {
  data: {
    query: gql`
      query getTags($organizationId: String!) {
        organization(id: $organizationId) {
          id
          tags {
            id
            name
            group
            description
            isDeleted
          }
        }
      }
    `,
    options: ownProps => ({
      variables: {
        organizationId: ownProps.organizationId
      },
      fetchPolicy: "network-only"
    })
  }
};

export default loadData({ queries })(CampaignCannedResponsesForm);
