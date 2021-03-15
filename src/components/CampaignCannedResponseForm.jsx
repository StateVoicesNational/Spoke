import type from "prop-types";
import React from "react";
import { StyleSheet, css } from "aphrodite";
import * as yup from "yup";
import GSForm from "./forms/GSForm";
import GSTextField from "./forms/GSTextField";
import GSScriptField from "./forms/GSScriptField";
import Form from "react-formal";
import Button from "@material-ui/core/Button";
import AutoComplete from "@material-ui/lab/Autocomplete";
import TextField from "@material-ui/core/TextField";
import { dataTest } from "../lib/attributes";
import GSSubmitButton from "./forms/GSSubmitButton";

const styles = StyleSheet.create({
  buttonRow: {
    marginTop: 5
  },
  tagChips: {
    display: "flex",
    flexWrap: "wrap"
  },
  button: {
    marginRight: 10
  }
});

// THIS IS A COPY/PASTE FROM CANNED RESPONSE FORM BECAUSE I CANT MAKE FORM.CONTEXT WORK
export default class CannedResponseForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ...this.props.defaultValue,
      tagIds: this.props.defaultValue.tagIds || []
    };
  }
  handleSave = () => {
    const { onSaveCannedResponse, handleCloseAddForm } = this.props;
    onSaveCannedResponse(this.state);
  };

  render() {
    const modelSchema = yup.object({
      title: yup.string().required(),
      text: yup.string().required()
    });
    this.form = React.createRef();
    this.autocompleteInput = React.createRef();

    const {
      customFields,
      handleCloseAddForm,
      formButtonText,
      tags
    } = this.props;
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
            multiLine
            fullWidth
          />
          <AutoComplete
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
          <div className={css(styles.buttonRow)}>
            <Form.Submit
              as={GSSubmitButton}
              label={formButtonText}
              className={css(styles.button)}
            />
            <Button
              variant="contained"
              {...dataTest("addResponse")}
              onClick={handleCloseAddForm}
            >
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
  tags: type.array
};
