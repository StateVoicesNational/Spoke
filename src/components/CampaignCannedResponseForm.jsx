import type from "prop-types";
import React from "react";
import { StyleSheet, css } from "aphrodite";
import yup from "yup";
import GSForm from "./forms/GSForm";
import Form from "react-formal";
import FlatButton from "material-ui/FlatButton";
import AutoComplete from "material-ui/AutoComplete";
import IconButton from "material-ui/IconButton";
import HelpIconOutline from "material-ui/svg-icons/action/help-outline";
import { dataTest } from "../lib/attributes";
import theme from "../styles/theme";
import TagChips from "./TagChips";

const styles = StyleSheet.create({
  buttonRow: {
    marginTop: 5
  },
  tagChips: {
    display: "flex",
    flexWrap: "wrap"
  },
  errorMessage: {
    color: theme.colors.red
  }
});

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
      availableActionsLookup: props.availableActions.reduce(
        (lookup, action) => {
          const toReturn = { ...lookup };
          toReturn[action.name] = action;
          return toReturn;
        },
        {}
      )
    };
  }
  handleSave = () => {
    const { onSaveCannedResponse } = this.props;

    onSaveCannedResponse({
      ...this.state,
      answerActionsData:
        this.state.answerActionsData &&
        typeof this.state.answerActionsData !== "string"
          ? JSON.stringify(this.state.answerActionsData)
          : this.state.answerActionsData
    });
  };

  render() {
    const modelSchema = yup.object({
      title: yup.string().required(),
      text: yup.string().required(),
      answerActions: yup.string(),
      answerActionsData: yup.string()
    });

    const {
      customFields,
      handleCloseAddForm,
      formButtonText,
      tags
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
          ref="form"
          schema={modelSchema}
          onSubmit={this.handleSave}
          defaultValue={this.state}
          onChange={v => this.setState(v)}
        >
          <Form.Field
            {...dataTest("title")}
            name="title"
            autoFocus
            fullWidth
            label="Title"
          />
          <Form.Field
            {...dataTest("editorResponse")}
            customFields={customFields}
            name="text"
            type="script"
            label="Script"
            multiLine
            fullWidth
          />
          {this.props.availableActions && this.props.availableActions.length ? (
            <div>
              <div>
                <Form.Field
                  {...dataTest("actionSelect")}
                  floatingLabelText="Action handler"
                  name="answerActions"
                  type="select"
                  default=""
                  choices={this.props.availableActions.map(action => ({
                    value: action.name,
                    label: action.displayName
                  }))}
                />
                <IconButton
                  tooltip="An action is something that is triggered by this answer being chosen, often in an outside system"
                  style={{ verticalAlign: "text-bottom" }}
                >
                  <HelpIconOutline />
                </IconButton>
                {instructions ? (
                  <div style={{ color: theme.colors.gray }}>{instructions}</div>
                ) : null}
              </div>
              {answerActions.clientChoiceData &&
              answerActions.clientChoiceData.length ? (
                <div>
                  <Form.Field
                    {...dataTest("actionDataAutoComplete")}
                    hintText="Start typing to search for the data to use with the answer action"
                    floatingLabelText="Answer Action Data"
                    fullWidth
                    name="answerActionsData"
                    type="autocomplete"
                    choices={answerActions.clientChoiceData.map(item => ({
                      value: item.details,
                      label: item.name
                    }))}
                  />
                  {needRequiredAnswerActionsData ? (
                    <div className={css(styles.errorMessage)}>
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
            ref="autocompleteInput"
            floatingLabelText="Tags"
            filter={AutoComplete.fuzzyFilter}
            dataSource={
              tags && tags.filter(t => this.state.tagIds.indexOf(t.id) === -1)
            }
            maxSearchResults={8}
            onNewRequest={({ id }) => {
              this.refs.autocompleteInput.setState({ searchText: "" });
              this.setState({ tagIds: [...this.state.tagIds, id] });
            }}
            dataSourceConfig={{
              text: "name",
              value: "id"
            }}
            fullWidth
          />
          <TagChips
            tags={tags}
            tagIds={this.state.tagIds}
            onRequestDelete={listedTag => {
              this.setState({
                tagIds: this.state.tagIds.filter(
                  tagId => tagId !== listedTag.id
                )
              });
            }}
          />
          <div className={css(styles.buttonRow)}>
            <FlatButton
              {...dataTest("addResponse")}
              label={formButtonText}
              backgroundColor={
                needRequiredAnswerActionsData
                  ? theme.colors.disabled
                  : theme.colors.green
              }
              labelStyle={{
                color: needRequiredAnswerActionsData
                  ? theme.colors.gray
                  : "white"
              }}
              style={{ display: "inline-block" }}
              disabled={needRequiredAnswerActionsData}
              onClick={() => {
                this.refs.form.submit();
              }}
            />
            <FlatButton
              label="Cancel"
              onTouchTap={handleCloseAddForm}
              style={{
                marginLeft: 5,
                display: "inline-block"
              }}
            />
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
  availableActions: type.array
};
