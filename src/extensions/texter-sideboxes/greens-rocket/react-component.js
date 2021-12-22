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

export const displayName = () => "CiviCRM/Rocket";

export const showSidebox = ({ contact }) => contact;

export class TexterSidebox extends React.Component {
  render() {
    const { contact, settingsData } = this.props;
    const contactCustomData = JSON.parse(contact.customFields);
    const rocketUrl = settingsData.rocketUrl
      ? settingsData.rocketUrl + contactCustomData.civicrmId
      : "";
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
                <strong>State Upper</strong>
                <br />
                {contactCustomData.stateUpper}
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
                <strong>LGA Ward</strong>
                <br />
                {contactCustomData.LGAWard}
              </ListItemText>
            </ListItem>
            <ListItem>
              <ListItemText>
                <strong>Branch</strong>
                <br />
                {contactCustomData.branch}
              </ListItemText>
            </ListItem>
            <ListItem>
              <ListItemText>
                <strong>
                  Last polling booth
                  <br />
                  (election day)
                </strong>
                <br />
                {contactCustomData.lastBooth}
              </ListItemText>
            </ListItem>
          </List>
        </div>
        <div>
          {rocketUrl && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                window.open(rocketUrl, "_blank");
              }}
            >
              View {contact.firstName} in Rocket
            </Button>
          )}
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

const rocketDomains = [
  { label: "(Disabled)", value: "" },
  {
    label: "ACT",
    value: "https://contact-act.greens.org.au/agc/ems8#!/contact/"
  },
  {
    label: "NSW",
    value: "https://contact-nsw.greens.org.au/agc/ems8#!/contact/"
  },
  {
    label: "NT",
    value: "https://contact-nt.greens.org.au/agc/ems8#!/contact/"
  },
  {
    label: "QLD",
    value: "https://contact-qld.greens.org.au/agc/ems8#!/contact/"
  },
  {
    label: "SA",
    value: "https://contact-sa.greens.org.au/agc/ems8#!/contact/"
  },
  {
    label: "TAS",
    value: "https://contact-tas.greens.org.au/agc/ems8#!/contact/"
  },
  {
    label: "VIC",
    value: "https://contact-vic.greens.org.au/agc/ems8#!/contact/"
  },
  { label: "WA", value: "https://contact-wa.greens.org.au/agc/ems8#!/contact/" }
];

const menuItems =
  rocketDomains.length > 0 &&
  rocketDomains.map((item, i) => {
    return (
      <MenuItem key={i} value={item.value}>
        {item.label}
      </MenuItem>
    );
  });

export const adminSchema = () => ({
  rocketUrl: yup.string(),
  texterInstructions: yup.string()
});

export class AdminConfig extends React.Component {
  render() {
    return (
      <React.Fragment>
        <p>
          Turning on this sidebox makes it possible for Spoke volunteers to see
          more information about the people they are messaging. By default,
          Spoke volunteers will see the federal &amp; state electorates, LGA and
          LGA wards that the person lives in, as well as the Greens branch/local
          group area. If the person has ever volunteered at a booth on election
          day, the name of the booth at the most recent election will be
          displayed. Pre-poll booths are not displayed.
        </p>
        <p>
          There are two configurable <em>optional</em> items. The first shows a
          button to open the person&quot;s record in Rocket. To work you must
          select the appropriate CiviCRM/Rocket domain and the Spoke voluntee
          must have Rocket access.
        </p>
        <p>
          The second is optional text that you can display to Spoke volunteers
          working on this campaign. It&quot's a useful way of providing
          reminders about campaign messages, and general tips about how to
          engage people effectively in conversation.
        </p>
        <InputLabel id="rocketUrl">
          Use Rocket button (pick CiviCRM/Rocket domain)
        </InputLabel>
        <Form.Field
          name="rocketUrl"
          label="Select CiviCRM/Rocket domain"
          as={Select}
          fullWidth
        >
          {menuItems}
        </Form.Field>
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
