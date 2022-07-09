import PropTypes from "prop-types";
import React from "react";
import { withRouter } from "react-router";
import gql from "graphql-tag";
import _ from "lodash";

import TextField from "@material-ui/core/TextField";
import CircularProgress from "@material-ui/core/CircularProgress";

import loadData from "../../../containers/hoc/load-data";

export const displayName = () => "Contact notes";

export const showSidebox = () => true;

export class TexterSideboxClass extends React.Component {
  constructor(props) {
    /* eslint-disable no-param-reassign */
    if (typeof props.contact.customFields === "string") {
      try {
        props.contact.customFields = JSON.parse(props.contact.customFields);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn(err);
        props.contact.customFields = {};
      }
    }

    /* eslint-enable no-param-reassign */
    super(props);
    this.state = {
      notes: props.contact.customFields.notes || "",
      isSaving: false,
      hasError: false
    };
  }

  componentDidUpdate() {
    const { notes: contactNotes } = this.props.contact.customFields;
    if (this.state.isSaving && contactNotes === this.state.notes) {
      this.setIsSaving(false);
    }
  }

  setIsSaving = isSaving => this.setState({ isSaving });

  debouncedUpdate = _.debounce(
    async notes => {
      const { contact, mutations } = this.props;
      try {
        const customFields = {
          ...contact.customFields,
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
