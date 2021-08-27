import type from "prop-types";
import React from "react";
import Form from "react-formal";
import * as yup from "yup";
import GSForm from "./forms/GSForm";
import GSTextField from "./forms/GSTextField";
import GSScriptField from "./forms/GSScriptField";
import GSSubmitButton from "./forms/GSSubmitButton";
import Button from "@material-ui/core/Button";

class CannedResponseForm extends React.Component {
  handleSave = formValues => {
    this.setState({ text: formValues.text });
    this.props.onSaveCannedResponse(formValues);
  };

  handleCloseDialog = () => {
    this.props.handleCloseDialog();
  };

  render() {
    const modelSchema = yup.object({
      title: yup.string().required(),
      text: yup.string().required()
    });

    const { customFields } = this.props;
    return (
      <div>
        <GSForm ref="form" schema={modelSchema} onSubmit={this.handleSave}>
          <Form.Field
            as={GSTextField}
            name="title"
            autoFocus
            fullWidth
            label="Title"
          />
          <Form.Field
            as={GSScriptField}
            customFields={customFields || []}
            name="text"
            type="script"
            label="Script"
            multiline
            fullWidth
          />
          <div
            style={{ float: "right", display: "flex", alignItems: "center" }}
          >
            <Button onClick={this.handleCloseDialog} style={{ marginTop: 15 }}>
              Cancel
            </Button>
            <Form.Submit as={GSSubmitButton} label="Save" />
          </div>
        </GSForm>
      </div>
    );
  }
}

CannedResponseForm.propTypes = {
  onSaveCannedResponse: type.func,
  customFields: type.array
};

export default CannedResponseForm;
