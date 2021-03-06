import type from "prop-types";
import React from "react";
import { StyleSheet, css } from "aphrodite";
import yup from "yup";
import GSForm from "./forms/GSForm";
import Form from "react-formal";
import FlatButton from "material-ui/FlatButton";
import AutoComplete from "material-ui/AutoComplete";
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
    const { onSaveCannedResponse } = this.props;
    onSaveCannedResponse(this.state);
  };

  render() {
    const modelSchema = yup.object({
      title: yup.string().required(),
      text: yup.string().required()
    });

    const {
      customFields,
      handleCloseAddForm,
      formButtonText,
      tags
    } = this.props;
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
              backgroundColor={theme.colors.coreBackgroundColor}
              labelStyle={{ color: "white" }}
              style={{
                display: "inline-block"
              }}
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
  tags: type.array
};
