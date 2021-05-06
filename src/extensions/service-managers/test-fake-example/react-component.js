/* eslint no-console: 0 */
import { css } from "aphrodite";
import { CardText } from "material-ui/Card";
import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";
import { Table, TableBody, TableRow, TableRowColumn } from "material-ui/Table";
import PropTypes from "prop-types";
import React from "react";
import Form from "react-formal";
import * as yup from "yup";
import DisplayLink from "../../../components/DisplayLink";
import GSForm from "../../../components/forms/GSForm";
import GSTextField from "../../../components/forms/GSTextField";
import GSSubmitButton from "../../../components/forms/GSSubmitButton";

export class OrgConfig extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    console.log("testfakedata OrgConfig", this.props);
    const formSchema = yup.object({
      savedText: yup
        .string()
        .nullable()
        .max(64)
    });
    return (
      <div>
        THIS IS TEST_FAKE_DATA
        <GSForm
          schema={formSchema}
          defaultValue={this.props.serviceManagerInfo.data}
          onSubmit={x => {
            console.log("onSubmit", x);
            this.props.onSubmit(x);
          }}
        >
          <Form.Field
            as={GSTextField}
            label="Some saveable text"
            name="savedText"
            fullWidth
          />
          <Form.Submit
            as={GSSubmitButton}
            label="Save"
            style={this.props.inlineStyles.dialogButton}
            component={GSSubmitButton}
          />
        </GSForm>
      </div>
    );
  }
}

OrgConfig.propTypes = {
  organizationId: PropTypes.string,
  serviceManagerInfo: PropTypes.object,
  inlineStyles: PropTypes.object,
  styles: PropTypes.object,
  saveLabel: PropTypes.string,
  onSubmit: PropTypes.func
};
