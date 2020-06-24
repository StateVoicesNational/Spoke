import type from "prop-types";
import React from "react";
import { Link } from "react-router";
import yup from "yup";
import Form from "react-formal";
import FlatButton from "material-ui/FlatButton";
import TagChip from "../../../components/TagChip";
import theme from "../../../styles/theme";
import CheckIcon from "material-ui/svg-icons/action/check-circle";
import CircularProgress from "material-ui/CircularProgress";
import DoneIcon from "material-ui/svg-icons/action/done";
import { css } from "aphrodite";
import {
  flexStyles,
  inlineStyles
} from "../../../components/AssignmentTexter/StyleControls";

export const displayName = () => "Tagging Contacts";

export const showSidebox = ({ campaign, messageStatusFilter, disabled }) => {
  // Return anything False-y to not show
  // Return anything Truth-y to show
  // Return 'popup' to force a popup on mobile screens (instead of letting it hide behind a button)
  console.log("showsidebox", campaign.organization.tags);
  return (
    !disabled &&
    messageStatusFilter !== "needsMessage" &&
    campaign.organization.tags.length
  );
};

export class TexterSidebox extends React.Component {
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
    console.log(
      "tag-contact render",
      typeof settingsData,
      settingsData,
      campaign
    );
    const escalatedTags = campaign.organization.tags.filter(
      tag => tag.id in currentTags
    );
    const otherTags = campaign.organization.tags.filter(
      tag => !(tag.id in currentTags)
    );
    return (
      <div>
        <h3>{settingsData.tagHeaderText || "Tag a contact here:"}</h3>
        <div>
          {escalatedTags.map(tag => (
            <TagChip
              text={tag.name}
              icon={<CheckIcon />}
              backgroundColor={theme.colors.white}
            />
          ))}
        </div>
        {otherTags.map(tag => (
          <TagChip
            text={tag.name}
            icon={(newTags[tag.id] && <DoneIcon />) || null}
            backgroundColor={
              newTags[tag.id] ? theme.colors.white : theme.colors.lightYellow
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
        <FlatButton
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
          label={settingsData.tagButtonText || "Save tags"}
          icon={
            (submitted === 1 && (
              <CircularProgress style={{ lineHeight: 1 }} size={16} />
            )) ||
            (submitted === 2 && <DoneIcon />) ||
            null
          }
          className={css(flexStyles.flatButton)}
          labelStyle={inlineStyles.flatButtonLabel}
          disabled={
            !Object.keys(newTags).filter(tid => newTags[tid]).length ||
            submitted >= 1
          }
        />
      </div>
    );
  }
}

TexterSidebox.propTypes = {
  // data
  contact: type.object,
  campaign: type.object,
  assignment: type.object,
  texter: type.object,

  // parent state
  disabled: type.bool,
  navigationToolbarChildren: type.object,
  messageStatusFilter: type.string,
  onUpdateTags: type.func
};

export const adminSchema = () => ({
  tagButtonText: yup.string(),
  tagHeaderText: yup.string()
});

export class AdminConfig extends React.Component {
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
          name="tagHeaderText"
          label="Header Text (prompt above tag list)"
          fullWidth
        />
        <Form.Field name="tagButtonText" label="Save Button Text" fullWidth />
      </div>
    );
  }
}

AdminConfig.propTypes = {
  settingsData: type.object,
  onToggle: type.func,
  organization: type.object
};
