import type from "prop-types";
import React from "react";
import * as yup from "yup";
import Form from "react-formal";
import Button from "@material-ui/core/Button";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import Divider from "@material-ui/core/Divider";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import InputLabel from "@material-ui/core/InputLabel";
import GSTextField from "../../../components/forms/GSTextField";

export const displayName = () => "gVIRS";

export const showSidebox = ({ contact }) => contact;

export class TexterSidebox extends React.Component {
  render() {
    const { contact, settingsData } = this.props;
    const contactCustomData = JSON.parse(contact.customFields);
    const texterInstructions = settingsData.texterInstructions;

    return (
      <div style={{ textAlign: "center" }}>
        <div>
          <h2>
            {contact.firstName} {contact.lastName}
          </h2>
          <List component="nav" aria-label="contact info" dense>
            <ListItem>
              <ListItemText>
                <strong>Federal Division</strong>
                <br />
                {contactCustomData.fedElec}
              </ListItemText>
            </ListItem>
            <ListItem>
              <ListItemText>
                <strong>State District</strong>
                <br />
                {contactCustomData.stateDistrict}
              </ListItemText>
            </ListItem>
            <ListItem>
              <ListItemText>
                <strong>LGA</strong>
                <br />
                {contactCustomData.LGA}
              </ListItemText>
            </ListItem>
            <ListItem>
              <ListItemText>
                <strong>Last recorded contact date</strong>
                <br />
                {contactCustomData.v_lsc_contact_date}
              </ListItemText>
            </ListItem>
            <ListItem>
              <ListItemText>
                <strong>Last recorded contact status</strong>
                <br />
                {contactCustomData.v_lsc_contact_status_name}
              </ListItemText>
            </ListItem>
            <ListItem>
              <ListItemText>
                <strong>Last recorded contact support level</strong>
                <br />
                {contactCustomData.v_lsc_support_level}
              </ListItemText>
            </ListItem>
            <ListItem>
              <ListItemText>
                <strong>Last recorded contact labels</strong>
                <br />
                {contactCustomData.v_lsc_contact_labels}
              </ListItemText>
            </ListItem>
          </List>
        </div>
        <div>&nbsp;</div>
        <Divider />
        <div>&nbsp;</div>
        {texterInstructions && <div>{texterInstructions}</div>}
      </div>
    );
  }
}

TexterSidebox.propTypes = {
  // data
  contact: type.object,
  settingsData: type.object,

  // parent state
  disabled: type.bool,
  navigationToolbarChildren: type.object,
  messageStatusFilter: type.string
};

export const adminSchema = () => ({
  texterInstructions: yup.string()
});

export class AdminConfig extends React.Component {
  render() {
    return (
      <React.Fragment>
        <p>
          Turning on this sidebox makes it possible for Spoke volunteers to see
          more information about the people they are messaging. By default,
          Spoke volunteers will see the federal &amp; state electorates, and LGA
          that the person lives in. If the person has ever been contacted in the
          past, information regarding the last contact with them will be
          displayed.
        </p>
        <p>
          There is one configurable <em>optional</em> item. You can provide
          optional text that you can display to Spoke volunteers working on this
          campaign. It&quot;s a useful way of providing reminders about campaign
          messages and general tips about how to engage people effectively in
          conversation.
        </p>
        <InputLabel id="texterInstructions">
          Instructions for Spoke volunteers
        </InputLabel>
        <Form.Field name="texterInstructions" as={GSTextField} fullWidth />
      </React.Fragment>
    );
  }
}

AdminConfig.propTypes = {
  settingsData: type.object,
  onToggle: type.func
};
