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
import IconButton from "@material-ui/core/IconButton";

import GSForm from "./forms/GSForm";
import CampaignFormSectionHeading from "./CampaignFormSectionHeading";
import theme from "../styles/theme";
import { StyleSheet, css } from "aphrodite";
import { dataTest } from "../lib/attributes";
import loadData from "../containers/hoc/load-data";
import gql from "graphql-tag";
import TagChips from "./TagChips";

const Span = ({ children }) => <span>{children}</span>;

const styles = StyleSheet.create({
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
    backgroundColor: theme.colors.white,
    padding: 10
  },
  title: {
    marginBottom: 8
  },
  text: {
    fontSize: 14,
    color: theme.colors.gray,
    marginBottom: 8,
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: 2,
    overflow: "hidden",
    height: 32
  }
});

export class CampaignCannedResponsesForm extends React.Component {
  state = {
    showForm: false,
    formButtonText: "",
    responseId: null
  };

  formSchema = yup.object({
    cannedResponses: yup.array().of(
      yup.object({
        title: yup.string(),
        text: yup.string()
      })
    )
  });

  showAddButton() {
    if (!this.state.showForm) {
      return (
        <div>
          <Button
            color="secondary"
            startIcon={<CreateIcon color="secondary" />}
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
        <div className={css(styles.formContainer)}>
          <div className={css(styles.form)}>
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
                  newEle.id = Math.random()
                    .toString(36)
                    .replace(/[^a-zA-Z1-9]+/g, "");
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
            />
          </div>
        </div>
      );
    }
  }

  listItems(cannedResponses) {
    const listItems = cannedResponses.map(response => (
      <ListItem
        {...dataTest("cannedResponse")}
        value={response.text}
        key={response.id}
      >
        <ListItemText>
          <div className={css(styles.title)}>{response.title}</div>
          <div className={css(styles.text)}>{response.text}</div>
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
          {this.showAddButton()}
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
  data: type.object
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
