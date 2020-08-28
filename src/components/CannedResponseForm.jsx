import type from "prop-types";
import React from "react";
import Form from "react-formal";
import yup from "yup";
import GSForm from "./forms/GSForm";

class CannedResponseForm extends React.Component {
  handleSave = formValues => {
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
          <Form.Field name="title" autoFocus fullWidth label="Title" />
          <Form.Field
            customFields={customFields || []}
            name="text"
            type="script"
            label="Script"
            multiLine
            fullWidth
          />
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
