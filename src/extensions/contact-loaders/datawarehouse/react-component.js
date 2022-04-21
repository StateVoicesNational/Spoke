import type from "prop-types";
import React from "react";
import Form from "react-formal";
import { StyleSheet, css } from "aphrodite";
import * as yup from "yup";
import { compose } from "recompose";

import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import Button from "@material-ui/core/Button";

import GSForm from "../../../components/forms/GSForm";
import GSTextField from "../../../components/forms/GSTextField";
import GSSubmitButton from "../../../components/forms/GSSubmitButton";
import withMuiTheme from "../../../containers/hoc/withMuiTheme";

const innerStyles = {
  button: {
    margin: "24px 5px 24px 0",
    fontSize: "10px"
  },
  sqlBox: {
    width: "100%"
  }
};

export class CampaignContactsFormBase extends React.Component {
  styles = StyleSheet.create({
    csvHeader: {
      fontFamily: "Courier",
      backgroundColor: this.props.muiTheme.palette.action.hover,
      padding: 3
    },
    exampleImageInput: {
      cursor: "pointer",
      position: "absolute",
      top: 0,
      bottom: 0,
      right: 0,
      left: 0,
      width: "100%",
      opacity: 0
    }
  });

  constructor(props) {
    super(props);
    const { lastResult } = props;
    let cur = {};
    if (lastResult && lastResult.reference) {
      cur = JSON.parse(lastResult.reference);
    }
    console.log("datawarehouse", lastResult, props);
    this.state = {
      contactSql: cur.contactSql || ""
    };
  }

  validateSql = () => {
    const errors = [];
    const sql = document.getElementById("contact-sql").value;
    if (!sql.startsWith("SELECT")) {
      errors.push('Must start with "SELECT" in caps');
    }
    if (
      /LIMIT (\d+)/i.test(sql) &&
      parseInt(sql.match(/LIMIT (\d+)/i)[1], 10) > 10000
    ) {
      errors.push(
        "Spoke currently does not support LIMIT statements of higher than 10000 (no limit is fine, though)"
      );
    }
    if (!/ORDER BY/i.test(sql)) {
      errors.push(
        "An ORDER BY statement is required to ensure loading all the contacts."
      );
    }
    const requiredFields = ["first_name", "last_name", "cell"];
    requiredFields.forEach(f => {
      if (sql.indexOf(f) === -1) {
        errors.push('"' + f + '" is a required column');
      }
    });
    if (sql.indexOf(";") >= 0) {
      errors.push('Do not include a trailing (or any) ";"');
    }
    if (!errors.length) {
      this.setState({
        contactSqlError: null
      });
      this.props.onChange(
        JSON.stringify({
          contactSql: sql
        })
      );
    } else {
      this.setState({ contactSqlError: errors.join(", ") });
      this.props.onChange("");
    }
  };

  render() {
    const { contactSqlError } = this.state;
    const { lastResult } = this.props;
    let results = {};
    if (lastResult && lastResult.result) {
      results = JSON.parse(lastResult.result);
    }
    return (
      <div>
        {results.errors && (
          <div>
            <h4 style={{ color: this.props.muiTheme.palette.error.main }}>
              Previous Errors
            </h4>
            <List>
              {results.errors.map(e => (
                <ListItem key={e}>
                  <ListItemIcon>{this.props.icons.error}</ListItemIcon>
                  <ListItemText primary={e} />
                </ListItem>
              ))}
            </List>
          </div>
        )}
        <GSForm
          schema={yup.object({
            contactSql: yup.string()
          })}
          defaultValue={this.state}
          onSubmit={formValues => {
            // sets values locally
            this.setState({ ...formValues });
            // and now do whatever happens when clicking 'Next'
            this.props.onSubmit();
          }}
        >
          <div>
            <div>
              Instead of uploading contacts, as a super-admin, you can also
              create a SQL query directly from the data warehouse that will load
              in contacts. The SQL requires some constraints:
              <ul>
                <li>Start the query with "SELECT"</li>
                <li>
                  Finish with a required "ORDER BY" -- if there is not a
                  reliable ordering then not all contacts may load.
                </li>
                <li>Do not include a trailing (or any) semicolon</li>
                <li>
                  Three columns are necessary:
                  <span className={css(this.styles.csvHeader)}>first_name</span>
                  ,<span className={css(this.styles.csvHeader)}>last_name</span>
                  ,<span className={css(this.styles.csvHeader)}>cell</span>,
                </li>
                <li>
                  Optional fields are:
                  <span className={css(this.styles.csvHeader)}>zip</span>,
                  <span className={css(this.styles.csvHeader)}>
                    external_id
                  </span>
                </li>
                <li>
                  Make sure you make those names exactly possibly requiring an
                  <span className={css(this.styles.csvHeader)}>
                    as field_name
                  </span>{" "}
                  sometimes.
                </li>
                <li>Other columns will be added to the customFields</li>
                <li>
                  During processing %&rsquo;s are not percentage complete, but
                  every 10K contacts
                </li>
              </ul>
            </div>
            <Form.Field
              as={GSTextField}
              id="contact-sql"
              name="contactSql"
              type="textarea"
              rows="5"
              style={innerStyles.sqlBox}
            />
            <Button
              style={innerStyles.button}
              variant="contained"
              onClick={this.validateSql}
            >
              Validate SQL
            </Button>
            {contactSqlError && (
              <List>
                <ListItem>
                  <ListItemIcon>{this.props.icons.error}</ListItemIcon>
                  <ListItemText primary={contactSqlError} />
                </ListItem>
              </List>
            )}
          </div>
          <Form.Submit
            as={GSSubmitButton}
            disabled={this.props.saveDisabled}
            label={this.props.saveLabel}
          />
        </GSForm>
      </div>
    );
  }
}

CampaignContactsFormBase.propTypes = {
  onChange: type.func,
  onSubmit: type.func,
  campaignIsStarted: type.bool,

  icons: type.object,

  saveDisabled: type.bool,
  saveLabel: type.string,

  clientChoiceData: type.string,
  jobResultMessage: type.string
};

const CampaignContactsForm = compose(withMuiTheme)(CampaignContactsFormBase);

export { CampaignContactsForm };
