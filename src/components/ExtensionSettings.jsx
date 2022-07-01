import React from "react";
import { Switch, FormGroup, FormControlLabel } from "@material-ui/core";

export default class OrganizationFeatureSettings extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <h2>Action Handlers</h2>
        <FormGroup>
          <FormControlLabel control={<Switch />} label="Test Action" />
        </FormGroup>
        <h2>Message Handlers</h2>
        <FormGroup>
          <FormControlLabel control={<Switch />} label="Profanity Trigger" />
          <FormControlLabel
            control={<Switch />}
            label="Auto Opt Out - Twillio"
          />
          <FormControlLabel
            control={<Switch />}
            label="NGP Van (caching bug)"
          />
        </FormGroup>
        <h2>Contact Loaders</h2>
        <FormControlLabel control={<Switch />} label="CSV Upload" />
        <FormControlLabel control={<Switch />} label="Fake Data Testing" />
      </div>
    );
  }
}
