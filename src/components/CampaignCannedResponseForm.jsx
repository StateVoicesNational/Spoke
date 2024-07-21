import type from "prop-types";
import React from "react";
import { StyleSheet, css } from "aphrodite";
import * as yup from "yup";
import GSForm from "./forms/GSForm";
import GSTextField from "./forms/GSTextField";
import GSScriptField from "./forms/GSScriptField";
import GSSelectField from "./forms/GSSelectField";
import GSAutoComplete from "./forms/GSAutoComplete";
import Form from "react-formal";
import IconButton from "@material-ui/core/IconButton";
import HelpOutlineIcon from "@material-ui/icons/HelpOutline";
import Tooltip from "@material-ui/core/Tooltip";
import Button from "@material-ui/core/Button";
import AutoComplete from "@material-ui/lab/Autocomplete";
import TextField from "@material-ui/core/TextField";
import { dataTest } from "../lib/attributes";
import GSSubmitButton from "./forms/GSSubmitButton";

// THIS IS A COPY/PASTE FROM CANNED RESPONSE FORM BECAUSE I CANT MAKE FORM.CONTEXT WORK
export default class CannedResponseForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ...this.props.defaultValue,
      tagIds: this.props.defaultValue.tagIds || [],
      answerActionsData:
        typeof this.props.defaultValue.answerActionsData === "string"
          ? JSON.parse(this.props.defaultValue.answerActionsData)
          : this.props.defaultValue.answerActionsData,
      availableActionsLookup:
        props.availableActions &&
        props.availableActions.reduce((lookup, action) => {
          const toReturn = { ...lookup };
          toReturn[action.name] = action;
          return toReturn;
        }, {})
    };
    this.styles = StyleSheet.create({
      buttonRow: {
        marginTop: 5
      },
      tagChips: {
        display: "flex",
        flexWrap: "wrap"
      },
      errorMessage: {
        color: this.props.muiTheme.palette.error.main
      },
      button: {
        marginRight: 10
      }
    });
  }

  handleSave = () => {
    const toSave = {
      ...this.state,
      answerActionsData:
        this.state.answerActionsData &&
        typeof this.state.answerActionsData !== "string"
          ? JSON.stringify(this.state.answerActionsData)
          : this.state.answerActionsData
    };

    delete toSave.availableActionsLookup;

    const { onSaveCannedResponse } = this.props;
    onSaveCannedResponse(toSave);
  };

  render() {
    const modelSchema = yup.object({
      title: yup.string().required(),
      text: yup.string().required(),
      answerActions: yup.string().nullable(),
      answerActionsData: yup.mixed()
    });
    this.form = React.createRef();
    this.autocompleteInput = React.createRef();

    const {
      customFields,
      handleCloseAddForm,
      formButtonText,
      tags,
      availableActions,
      serviceManagerContext
    } = this.props;

    const answerActions =
      this.state.answerActions &&
      this.state.availableActionsLookup[this.state.answerActions];

    let clientChoiceData,
      instructions,
      needRequiredAnswerActionsData = false;
    if (answerActions) {
      ({ clientChoiceData, instructions } = answerActions);
      needRequiredAnswerActionsData =
        clientChoiceData &&
        clientChoiceData.length &&
        !this.state.answerActionsData;
    }

    return (
      <div>
        <GSForm
          ref={this.form}
          schema={modelSchema}
          onSubmit={this.handleSave}
          defaultValue={this.state}
          onChange={v => this.setState(v)}
        >
          <Form.Field
            as={GSTextField}
            {...dataTest("title")}
            name="title"
            autoFocus
            fullWidth
            label="Title"
          />
          <Form.Field
            as={GSScriptField}
            {...dataTest("editorResponse")}
            customFields={customFields}
            name="text"
            type="script"
            label="Script"
            multiline
            fullWidth
            serviceManagerContext={serviceManagerContext}
          />
          {availableActions && availableActions.length ? (
            <div>
              <div style={{ display: "flex" }}>
                <Form.Field
                  {...dataTest("actionSelect")}
                  label="Action Handler"
                  name="answerActions"
                  as={GSSelectField}
                  choices={this.props.availableActions.map(action => ({
                    value: action.name,
                    label: action.displayName
                  }))}
                  fullWidth
                  style={{ flexGrow: 1 }}
                />
                <Tooltip title="An action is something that is triggered by this answer being chosen, often in an outside system">
                  <IconButton>
                    <HelpOutlineIcon />
                  </IconButton>
                </Tooltip>
              </div>
              {instructions ? (
                <div style={{ color: this.props.muiTheme.palette.grey[500] }}>
                  {instructions}
                </div>
              ) : null}
              {clientChoiceData && clientChoiceData.length ? (
                <div>
                  <Form.Field
                    {...dataTest("actionDataAutoComplete")}
                    placeholder="Start typing to search for the data to use with the answer action"
                    label="Answer Action Data"
                    fullWidth
                    name="answerActionsData"
                    options={clientChoiceData.map(item => ({
                      value: item.details,
                      label: item.name
                    }))}
                    as={GSAutoComplete}
                  />
                  {needRequiredAnswerActionsData ? (
                    <div className={css(this.styles.errorMessage)}>
                      Action requires additional data. Please select something.
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : (
            ""
          )}
          <AutoComplete
            {...dataTest("autocompleteTags")}
            multiple
            fullWidth
            ref={this.autocompleteInput}
            options={
              tags && tags.filter(t => this.state.tagIds.indexOf(t.id) === -1)
            }
            getOptionLabel={option => option.name}
            value={
              tags && tags.filter(t => this.state.tagIds.indexOf(t.id) > -1)
            }
            onChange={(event, selectedTags) => {
              this.setState({ tagIds: selectedTags.map(tag => tag.id) });
            }}
            renderInput={params => {
              return <TextField {...params} label="Tags" />;
            }}
          />
          <div className={css(this.styles.buttonRow)}>
            <Form.Submit
              as={GSSubmitButton}
              {...dataTest("addResponse")}
              label={formButtonText}
              className={css(this.styles.button)}
              disabled={!!needRequiredAnswerActionsData}
            />
            <Button variant="contained" onClick={handleCloseAddForm}>
              Cancel
            </Button>
          </div>
        </GSForm>
      </div>
    );
  }
}

CannedResponseForm.propTypes = {
  onSaveCannedResponse: type.func,
  handleCloseAddForm: type.func,
  customFields: type.array,
  formButtonText: type.string,
  defaultValue: type.object,
  tags: type.array,
  serviceManagerContext: type.object,
  availableActions: type.array
};
