import type from "prop-types";
import React from "react";
import RaisedButton from "material-ui/RaisedButton";
import GSForm from "../../../components/forms/GSForm";
import Form from "react-formal";
import { ListItem, List } from "material-ui/List";
import CampaignFormSectionHeading from "../../../components/CampaignFormSectionHeading";
import theme from "../../../styles/theme";
import { StyleSheet, css } from "aphrodite";
import yup from "yup";

const innerStyles = {
  button: {
    margin: "24px 5px 24px 0",
    fontSize: "10px"
  },
  sqlBox: {
    width: "100%"
  }
};

const styles = StyleSheet.create({
  csvHeader: {
    fontFamily: "Courier",
    backgroundColor: theme.colors.lightGray,
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

export class CampaignContactsForm extends React.Component {
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
        {results.errors ? (
          <div>
            <h4 style={{ color: theme.colors.red }}>Previous Errors</h4>
            <List>
              {results.errors.map(e => (
                <ListItem
                  key={e}
                  primaryText={e}
                  leftIcon={this.props.icons.error}
                />
              ))}
            </List>
          </div>
        ) : (
          ""
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
                  <span className={css(styles.csvHeader)}>first_name</span>,
                  <span className={css(styles.csvHeader)}>last_name</span>,
                  <span className={css(styles.csvHeader)}>cell</span>,
                </li>
                <li>
                  Optional fields are:
                  <span className={css(styles.csvHeader)}>zip</span>,
                  <span className={css(styles.csvHeader)}>external_id</span>
                </li>
                <li>
                  Make sure you make those names exactly possibly requiring an
                  <span className={css(styles.csvHeader)}>
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
              id="contact-sql"
              name="contactSql"
              type="textarea"
              rows="5"
              style={innerStyles.sqlBox}
            />
            <RaisedButton
              style={innerStyles.button}
              label="Validate SQL"
              labelPosition="before"
              onClick={this.validateSql}
            />
            {contactSqlError ? (
              <List>
                <ListItem
                  primaryText={contactSqlError}
                  leftIcon={this.props.icons.error}
                />
              </List>
            ) : (
              ""
            )}
          </div>
          <Form.Button
            type="submit"
            disabled={this.props.saveDisabled}
            label={this.props.saveLabel}
          />
        </GSForm>
      </div>
    );
  }
}

CampaignContactsForm.propTypes = {
  onChange: type.func,
  onSubmit: type.func,
  campaignIsStarted: type.bool,

  icons: type.object,

  saveDisabled: type.bool,
  saveLabel: type.string,

  clientChoiceData: type.string,
  jobResultMessage: type.string
};
