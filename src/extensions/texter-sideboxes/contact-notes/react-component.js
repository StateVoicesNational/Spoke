import PropTypes from "prop-types";
import React from "react";
import { withRouter } from "react-router";
import { gql } from "@apollo/client";
import _ from "lodash";

import TextField from "@material-ui/core/TextField";
import CircularProgress from "@material-ui/core/CircularProgress";

import loadData from "../../../containers/hoc/load-data";

export const displayName = () => "Contact notes";

export const showSidebox = ({ contact }) => {
  return contact;
};

const parseCustomFields = customFields => {
  if (typeof customFields === "string") {
    try {
      customFields = JSON.parse(customFields || "{}");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(err);
      customFields = {};
    }
  }
  return customFields;
};

export class TexterSideboxClass extends React.Component {
  constructor(props) {
    let parsedCustomFields = parseCustomFields(props.contact.customFields);
    super(props);
    this.state = {
      parsedCustomFields,
      notes: parsedCustomFields.notes || "",
      isSaving: false,
      hasError: false
    };
  }

  componentDidUpdate() {
    const { contact } = this.props;
    const { notes: contactNotes } = parseCustomFields(contact.customFields);
    if (this.state.isSaving && contactNotes === this.state.notes) {
      this.setIsSaving(false);
    }
  }

  setIsSaving = isSaving => this.setState({ isSaving });

  debouncedUpdate = _.debounce(
    async notes => {
      const { parsedCustomFields } = this.state;
      const { contact, mutations } = this.props;
      try {
        const customFields = {
          ...parsedCustomFields,
          notes
        };
        await mutations.updateContactCustomFields(JSON.stringify(customFields));
        await this.props.updateContactData(contact.id, { customFields });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
        this.setState({ hasError: true });
      }
    },
    500,
    { leading: false, trailing: true }
  );

  handleChange = ({ target: { value } }) => {
    this.setState({ notes: value, hasError: false });
    this.setIsSaving(true);
    this.debouncedUpdate(value);
  };

  render() {
    const { notes, isSaving, hasError } = this.state;

    return (
      <div style={{ marginTop: 15 }}>
        <TextField
          id="contact-notes"
          style={{ backgroundColor: "#dfdfdf" }}
          label="Contact Notes"
          multiline
          rows={6}
          variant="outlined"
          value={notes}
          onChange={this.handleChange}
        />
        {hasError ? (
          <div style={{ marginTop: 5 }}>
            <em style={{ color: "red", textAlign: "center" }}>
              Error saving notes
            </em>
          </div>
        ) : (
          isSaving && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                marginTop: 5
              }}
            >
              <CircularProgress size={15} disableShrink />
              <em style={{ marginLeft: 6, color: "#555" }}>Saving notes...</em>
            </div>
          )
        )}
      </div>
    );
  }
}

TexterSideboxClass.propTypes = {
  router: PropTypes.object,
  mutations: PropTypes.object,
  contact: PropTypes.object,
  updateContactData: PropTypes.func
};

export const mutations = {
  updateContactCustomFields: ownProps => customFields => ({
    mutation: gql`
      mutation updateContactCustomFields(
        $campaignContactId: String!
        $customFields: String!
      ) {
        updateContactCustomFields(
          campaignContactId: $campaignContactId
          customFields: $customFields
        ) {
          id
          customFields
        }
      }
    `,
    variables: {
      campaignContactId: ownProps.contact.id,
      customFields
    }
  })
};

export const TexterSidebox = loadData({ mutations })(
  withRouter(TexterSideboxClass)
);

export const adminSchema = () => ({});

export const AdminConfig = () => (
  <div>
    <p>
      The texter can enter notes for a contact in a sidebar input. Notes will
      save to a custom field on the contact called "notes". You can upload
      contact lists to new campaigns containing a column called "notes" which
      will show up in this input to persist this data across campaigns.
    </p>
  </div>
);

AdminConfig.propTypes = {
  settingsData: PropTypes.object,
  onToggle: PropTypes.func
};
