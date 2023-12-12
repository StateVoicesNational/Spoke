import gql from "graphql-tag";
import pick from "lodash/pick";
import React, { Component } from "react";
import {flowRight as compose} from 'lodash';

import Paper from "@material-ui/core/Paper";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import FormControl from "@material-ui/core/FormControl";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";

import loadData from "./hoc/load-data";

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
    includeArchived: false,
    campaignTitlePrefix: "",
    targetObject: ["interactionStep", "cannedResponse"]
  };

  handleChangeSearchString = event => {
    const flaggedCharacters = PROTECTED_CHARACTERS.filter(
      character => event.target.value.indexOf(character) > -1
    );
    this.setState({ searchString: event.target.value, flaggedCharacters });
  };

  handleChangeReplaceString = event => {
    this.setState({ replaceString: event.target.value });
  };

  handleToggleIncludeArchived = event => {
    this.setState({ includeArchived: event.target.checked });
  };

  handleCampaignPrefixChange = event => {
    this.setState({ campaignTitlePrefix: event.target.value });
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
      "targetObject"
    ]);
    findAndReplace.campaignTitlePrefixes = this.state.campaignTitlePrefix
      ? [this.state.campaignTitlePrefix]
      : [];
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
      campaignTitlePrefix
    } = this.state;
    const isSubmitDisabled = isSubmitting || !searchString;

    const flaggedCharacterActions = [
      <Button key="cancel" onClick={this.handleClose}>
        Cancel
      </Button>,
      <Button
        key="confirm"
        variant="contained"
        color="primary"
        onClick={this.handleConfirmSubmit}
      >
        Confirm
      </Button>
    ];

    const dialogActions = [
      <Button
        key="ok"
        variant="contained"
        color="primary"
        onClick={this.handleClose}
      >
        OK
      </Button>
    ];

    return (
      <div>
        <h1>Bulk Script Editor</h1>
        <Paper style={styles.paddedPaper}>
          <p style={styles.bold}>Find and replace</p>
          <FormControl fullWidth>
            <TextField
              placeholder="Replace this text..."
              value={searchString}
              fullWidth
              disabled={isSubmitting}
              onChange={this.handleChangeSearchString}
              style={{ marginBottom: "25px" }}
            />
          </FormControl>
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
          <FormControl fullWidth>
            <TextField
              placeholder="...with this text"
              value={replaceString}
              fullWidth
              disabled={isSubmitting}
              onChange={this.handleChangeReplaceString}
            />
          </FormControl>
          <p style={{ fontStyle: "italic" }}>
            Note: the text must be an exact match. For example, be careful of
            single quotes vs. double quotes: <span style={styles.code}>'</span>{" "}
            vs <span style={styles.code}>’</span>
          </p>
        </Paper>
        <Paper style={styles.paddedPaper}>
          <p style={styles.bold}>Filters</p>
          <FormControlLabel
            label="Include archived campaigns"
            disabled={isSubmitting}
            style={{ marginBottom: "25px" }}
            control={
              <Switch
                color="primary"
                checked={includeArchived}
                onChange={this.handleToggleIncludeArchived}
              />
            }
          />

          <FormControl fullWidth>
            <InputLabel id="scriptTypes">Script Types Affected</InputLabel>
            <Select
              multiple
              fullWidth
              labelId="scriptTypes"
              value={this.state.targetObject}
              // floatingLabelText={"Script Types Affected"}
              // floatingLabelFixed
              onChange={event =>
                this.setState({ targetObject: event.target.value })
              }
            >
              <MenuItem value="interactionStep">Interaction Steps</MenuItem>
              <MenuItem value="cannedResponse">Canned Responses</MenuItem>
            </Select>
          </FormControl>
          <p>Restrict to campaigns beginning with text (optional):</p>
          <TextField
            placeholder="Campaign title prefix"
            value={campaignTitlePrefix}
            fullWidth
            disabled={isSubmitting}
            onChange={this.handleCampaignPrefixChange}
          />
          {/*
          <CampaignPrefixSelector
            value={campaignTitlePrefixes}
            isDisabled={isSubmitting}
            onChange={this.handleCampaignPrefixChange}
          /> */}
        </Paper>
        <Button
          variant="contained"
          color="primary"
          disabled={isSubmitDisabled}
          onClick={this.handleSubmitJob}
        >
          {isSubmitting ? "Working..." : "Find & replace"}
        </Button>

        <Dialog open={!!confirmFlaggedCharacters} onClose={this.handleClose}>
          <DialogTitle>Confirm Flagged Characters</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to run run a bulk script update with special
              characters?
            </DialogContentText>
            <DialogContentText>
              If you don't know what this means, you should cancel and ask an
              admin!
            </DialogContentText>
          </DialogContent>
          <DialogActions>{flaggedCharacterActions}</DialogActions>
        </Dialog>

        <Dialog open={!!this.state.error} onClose={this.handleClose}>
          <DialogTitle>Error</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Spoke ran into the following error when trying to update scripts:
            </DialogContentText>
            <DialogContentText style={{ fontFamily: "monospace" }}>
              {this.state.error}
            </DialogContentText>
          </DialogContent>
          <DialogActions>{dialogActions}</DialogActions>
        </Dialog>

        <Dialog
          open={this.state.result !== null}
          fullWidth
          maxWidth="sm"
          onClose={this.handleClose}
        >
          <DialogTitle>
            Updated {this.state.result && this.state.result.length} Occurence(s)
          </DialogTitle>
          <DialogContent>
            <ul>
              {this.state.result &&
                this.state.result.map(
                  ({ campaign, found, replaced, target }) => (
                    <li key={`${campaign.id}|${found}|${replaced}`}>
                      Campaign ID: {campaign.id} ({target})
                      <br />
                      Found: <span style={styles.code}>{found}</span>
                      <br />
                      Replaced with: <span style={styles.code}>{replaced}</span>
                    </li>
                  )
                )}
            </ul>
            {this.state.result && this.state.result.length === 0 && (
              <p>
                No occurences were found. Check your search parameters and try
                again.
              </p>
            )}
          </DialogContent>
          <DialogActions>{dialogActions}</DialogActions>
        </Dialog>
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
          target
        }
      }
    `,
    variables: {
      organizationId: ownProps.params.organizationId,
      findAndReplace
    }
  })
};

export default compose(loadData({ mutations }))(AdminBulkScriptEditor);
