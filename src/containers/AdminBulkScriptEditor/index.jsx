import gql from "graphql-tag";
import pick from "lodash/pick";
import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";
import Paper from "material-ui/Paper";
import RaisedButton from "material-ui/RaisedButton";
import TextField from "material-ui/TextField";
import SelectField from "material-ui/SelectField";
import MenuItem from "material-ui/MenuItem";
import Toggle from "material-ui/Toggle";
import React, { Component } from "react";

import loadData from "../hoc/load-data";
// import CampaignPrefixSelector from "./CampaignPrefixSelector";

const PROTECTED_CHARACTERS = ["/"];

const styles = {
  bold: {
    fontWeight: "bold"
  },
  paddedPaper: {
    padding: "10px",
    marginBottom: "15px"
  },
  code: {
    color: "#000000",
    backgroundColor: "#DDDDDD",
    fontFamily: "monospace",
    fontSize: "1.2em",
    fontStyle: "normal",
    padding: "2px 5px",
    borderRadius: "3px"
  }
};

class AdminBulkScriptEditor extends Component {
  state = {
    isSubmitting: false,
    error: "",
    result: null,
    flaggedCharacters: [],
    confirmFlaggedCharacters: false,
    searchString: "",
    replaceString: "",
    includeArchived: true,
    campaignTitlePrefixes: [],
    targetObject: ["interactionStep", "cannedResponse"]
  };

  handleChangeSearchString = (_event, searchString) => {
    const flaggedCharacters = PROTECTED_CHARACTERS.filter(
      character => searchString.indexOf(character) > -1
    );
    this.setState({ searchString, flaggedCharacters });
  };

  handleChangeReplaceString = (_event, replaceString) => {
    this.setState({ replaceString });
  };

  handleToggleIncludeArchived = (_event, includeArchived) => {
    this.setState({ includeArchived });
  };

  handleCampaignPrefixChange = campaignTitlePrefixes => {
    this.setState({ campaignTitlePrefixes });
  };

  handleSubmitJob = async () => {
    const { flaggedCharacters } = this.state;
    if (flaggedCharacters.length > 0) {
      this.setState({ confirmFlaggedCharacters: true });
    } else {
      this.submitJob();
    }
  };

  handleConfirmSubmit = () => {
    this.setState({ confirmFlaggedCharacters: false });
    this.submitJob();
  };

  submitJob = async () => {
    this.setState({ isSubmitting: true });
    const findAndReplace = pick(this.state, [
      "searchString",
      "replaceString",
      "includeArchived",
      "campaignTitlePrefixes",
      "targetObject"
    ]);
    findAndReplace.campaignTitlePrefixes = findAndReplace.campaignTitlePrefixes.map(
      prefix => prefix.value
    );
    try {
      const response = await this.props.mutations.bulkUpdateScript(
        findAndReplace
      );
      if (response.errors) throw response.errors;
      this.setState({ result: response.data.bulkUpdateScript });
    } catch (error) {
      this.setState({ error: error.message });
    } finally {
      this.setState({ isSubmitting: false });
    }
  };

  handleClose = () => {
    this.setState({
      confirmFlaggedCharacters: false,
      error: "",
      result: null
    });
  };

  render() {
    const {
      isSubmitting,
      searchString,
      flaggedCharacters,
      confirmFlaggedCharacters,
      replaceString,
      includeArchived,
      campaignTitlePrefixes
    } = this.state;
    const isSubmitDisabled = isSubmitting || !searchString;

    const flaggedCharacterActions = [
      <FlatButton key="cancel" label="Cancel" onClick={this.handleClose} />,
      <FlatButton
        key="confirm"
        label="Confirm"
        primary
        onClick={this.handleConfirmSubmit}
      />
    ];

    const dialogActions = [
      <FlatButton key="ok" label="OK" primary onClick={this.handleClose} />
    ];

    return (
      <div>
        <h1>Bulk Script Editor</h1>
        <Paper style={styles.paddedPaper}>
          <p style={styles.bold}>Find and replace</p>
          <TextField
            hintText="Replace this text..."
            value={searchString}
            fullWidth
            disabled={isSubmitting}
            onChange={this.handleChangeSearchString}
          />
          {flaggedCharacters.length > 0 && (
            <p style={{ color: "#FFAA00" }}>
              Warning: Your search text contains the following special
              characters:{" "}
              {flaggedCharacters.map(char => (
                <span key={char} style={styles.code}>
                  {char}
                </span>
              ))}{" "}
              Be careful with this!
            </p>
          )}
          <TextField
            hintText="...with this text"
            value={replaceString}
            fullWidth
            disabled={isSubmitting}
            onChange={this.handleChangeReplaceString}
          />
          <p style={{ fontStyle: "italic" }}>
            Note: the text must be an exact match! For example, there a couple
            apostraphe characters: <span style={styles.code}>'</span> vs{" "}
            <span style={styles.code}>’</span> )
          </p>
        </Paper>
        <Paper style={styles.paddedPaper}>
          <p style={styles.bold}>Filters</p>
          <Toggle
            label="Include archived campaigns"
            style={{ marginBottom: "25px" }}
            toggled={includeArchived}
            disabled={isSubmitting}
            onToggle={this.handleToggleIncludeArchived}
          />

          <SelectField
            multiple
            value={this.state.targetObject}
            floatingLabelText={"Script Types Affected"}
            floatingLabelFixed
            onChange={(proxy, _, val) => this.setState({ targetObject: val })}
            style={{ width: "100%" }}
          >
            <MenuItem
              key="interactionStep"
              value="interactionStep"
              primaryText="Interaction Steps"
              checked={this.state.targetObject.indexOf("interactionStep") != -1}
            />
            <MenuItem
              key="cannedResponse"
              value="cannedResponse"
              primaryText="Canned Responses"
              checked={this.state.targetObject.indexOf("cannedResponse") != -1}
            />
          </SelectField>
          {/* <p>Restrict to campaigns beginning with text (optional):</p>
          <CampaignPrefixSelector
            value={campaignTitlePrefixes}
            isDisabled={isSubmitting}
            onChange={this.handleCampaignPrefixChange}
          /> */}
        </Paper>
        <RaisedButton
          label={isSubmitting ? "Working..." : "Find & replace"}
          primary
          disabled={isSubmitDisabled}
          onClick={this.handleSubmitJob}
        />
        {confirmFlaggedCharacters && (
          <Dialog
            title="Confirm Flagged Characters"
            actions={flaggedCharacterActions}
            open
            onRequestClose={this.handleClose}
          >
            <p>
              Are you sure you want to run run a bulk script update with special
              characters?
            </p>
            <p>
              If you don't know what this means, you should cancel and ask an
              admin!
            </p>
          </Dialog>
        )}
        {this.state.error && (
          <Dialog
            title="Error"
            actions={dialogActions}
            open
            onRequestClose={this.handleClose}
          >
            <p>
              Spoke ran into the following error when trying to update scripts:
            </p>
            <p style={{ fontFamily: "monospace" }}>{this.state.error}</p>
          </Dialog>
        )}
        {this.state.result !== null && (
          <Dialog
            title={`Updated ${this.state.result.length} Occurence(s)`}
            actions={dialogActions}
            modal={false}
            open
            autoScrollBodyContent
            contentStyle={{
              width: "100%",
              maxWidth: "none"
            }}
            onRequestClose={this.handleClose}
          >
            <ul>
              {this.state.result.map(({ campaignId, found, replaced }) => (
                <li key={`${campaignId}|${found}|${replaced}`}>
                  Campaign ID: {campaignId}
                  <br />
                  Found: <span style={styles.code}>{found}</span>
                  <br />
                  Replaced with: <span style={styles.code}>{replaced}</span>
                </li>
              ))}
            </ul>
            {this.state.result.length === 0 && (
              <p>
                No occurences were found. Check your search parameters and try
                again.
              </p>
            )}
          </Dialog>
        )}
      </div>
    );
  }
}

const mutations = {
  bulkUpdateScript: ownProps => findAndReplace => ({
    mutation: gql`
      mutation bulkUpdateScript(
        $organizationId: String!
        $findAndReplace: BulkUpdateScriptInput!
      ) {
        bulkUpdateScript(
          organizationId: $organizationId
          findAndReplace: $findAndReplace
        ) {
          campaign {
            id
          }
          found
          replaced
        }
      }
    `,
    variables: {
      organizationId: ownProps.params.organizationId,
      findAndReplace
    }
  })
};

export default loadData({
  mutations
})(AdminBulkScriptEditor);
