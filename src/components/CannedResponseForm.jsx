import type from "prop-types";
import React from "react";
import Form from "react-formal";
import * as yup from "yup";
import GSForm from "./forms/GSForm";
import GSTextField from "./forms/GSTextField";
import GSScriptField from "./forms/GSScriptField";

class CannedResponseForm extends React.Component {
  handleSave = formValues => {
    console.log("SAVE1!!!");
    this.setState({ text: formValues.text });
    this.props.onSaveCannedResponse(formValues);
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
            multiLine
            fullWidth
          />
          {this.props.actions}
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
