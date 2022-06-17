import type from "prop-types";
import React from "react";
import { Link } from "react-router";
import * as yup from "yup";
import Form from "react-formal";
import { css } from "aphrodite";
import { compose } from "recompose";

import CheckIcon from "@material-ui/icons/Check";
import DoneIcon from "@material-ui/icons/Done";
import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";

import GSTextField from "../../../components/forms/GSTextField";
import TagChip from "../../../components/TagChip";
import theme from "../../../styles/theme";
import { flexStyles } from "../../../components/AssignmentTexter/StyleControls";
import withMuiTheme from "../../../containers/hoc/withMuiTheme";

export const displayName = () => "Tagging Contacts";

export const showSidebox = ({ contact, campaign }) => {
  // Return anything False-y to not show
  // Return anything Truth-y to show
  // Return 'popup' to force a popup on mobile screens (instead of letting it hide behind a button)
  return (
    contact &&
    !contact.optOut &&
    contact.messageStatus !== "needsMessage" &&
    campaign.organization.tags.length
  );
};

const defaultTagHeaderText = "Tag a contact here:";
const defaultTagButtonText = "Save tags";

export class TexterSideboxBase extends React.Component {
  state = {
    newTags: {},
    submitted: 0
  };

  render() {
    const { campaign, contact, settingsData } = this.props;
    const { newTags, submitted } = this.state;
    const currentTags = {};
    contact.tags.forEach(t => {
      currentTags[t.id] = t.name;
    });
    // message from top
    // tag list (marking tags already set as disabled and 'on') -- i.e. you can only turn ON a tag, not off
    // save button
    // get campaign.texterUIConfig
    const escalatedTags = campaign.organization.tags.filter(
      tag => tag.id in currentTags
    );
    const otherTags = campaign.organization.tags.filter(
      tag => !(tag.id in currentTags)
    );
    return (
      <div>
        <h3>{settingsData.tagHeaderText || defaultTagHeaderText}</h3>
        <div>
          {escalatedTags.map((tag, index) => (
            <TagChip
              key={index}
              text={tag.name}
              icon={<CheckIcon />}
              backgroundColor={this.props.muiTheme.palette.common.white}
            />
          ))}
        </div>
        {otherTags.map((tag, index) => (
          <TagChip
            key={index}
            text={tag.name}
            icon={(newTags[tag.id] && <DoneIcon />) || null}
            backgroundColor={
              newTags[tag.id]
                ? this.props.muiTheme.palette.common.white
                : this.props.muiTheme.palette.warning.main
            }
            onClick={() => {
              if (tag.id in currentTags) {
                return;
              }
              this.setState({
                newTags: {
                  ...newTags,
                  [tag.id]: newTags[tag.id] ? false : tag.name
                },
                submitted: 0
              });
            }}
          />
        ))}
        <br />
        <Button
          variant="contained"
          style={{ marginTop: "20px" }}
          onClick={() => {
            const self = this;
            this.setState({ submitted: 1 }, () => {
              // TODO: include old tags as well, not just new tags
              const tags = Object.keys(newTags)
                .filter(tid => newTags[tid])
                .map(tid => ({ id: tid, name: newTags[tid] }));
              self.props
                .onUpdateTags(tags)
                .then(() => {
                  self.setState({ submitted: 2 });
                })
                .catch(err => {
                  console.log("error saving tags", err, self.state.newTags);
                  self.setState({
                    submitted: -1,
                    error: err
                  });
                });
            });
          }}
          startIcon={
            (submitted === 1 && (
              <CircularProgress style={{ lineHeight: 1 }} size={16} />
            )) ||
            (submitted === 2 && <DoneIcon />) ||
            null
          }
          className={css(flexStyles.flatButton)}
          disabled={
            !Object.keys(newTags).filter(tid => newTags[tid]).length ||
            submitted >= 1
          }
        >
          {settingsData.tagButtonText || defaultTagButtonText}
        </Button>
      </div>
    );
  }
}

TexterSideboxBase.propTypes = {
  // data
  contact: type.object,
  campaign: type.object,
  assignment: type.object,
  texter: type.object,

  // parent state
  disabled: type.bool,
  navigationToolbarChildren: type.object,
  onUpdateTags: type.func
};

const TexterSidebox = compose(withMuiTheme)(TexterSideboxBase);

export { TexterSidebox };

export const adminSchema = () => ({
  tagButtonText: yup.string(),
  tagHeaderText: yup.string()
});

export class AdminConfig extends React.Component {
  componentDidMount() {
    const { settingsData } = this.props;
    // set defaults
    const defaults = {};
    if (!settingsData.tagHeaderText) {
      defaults.tagHeaderText = defaultTagHeaderText;
    }
    if (!settingsData.tagButtonText) {
      defaults.tagButtonText = defaultTagButtonText;
    }

    if (Object.values(defaults).length) {
      this.props.setDefaultsOnMount(defaults);
    }
  }

  render() {
    return (
      <div>
        <p>
          Enabling this will prompt the user to tag contacts. It can be used to
          flag contacts for escalation or just save info about their behavior.
          They will only be shown{" "}
          <Link
            target="_blank"
            to={`/admin/${this.props.organization.id}/tags`}
          >
            tags
          </Link>{" "}
          with group <code>texter-tags</code>.
        </p>
        <Form.Field
          as={GSTextField}
          name="tagHeaderText"
          label="Header Text (prompt above tag list)"
          fullWidth
        />
        <Form.Field
          as={GSTextField}
          name="tagButtonText"
          label="Save Button Text"
          fullWidth
        />
      </div>
    );
  }
}

AdminConfig.propTypes = {
  settingsData: type.object,
  onToggle: type.func,
  organization: type.object,
  setDefaultsOnMount: type.func
};
