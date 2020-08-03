import type from "prop-types";
import React from "react";
import yup from "yup";
import TextField from "material-ui/TextField";

export const displayName = () => "Display Animated GIF When Done Texting";

export const showSidebox = ({ navigationToolbarChildren }) => {
  // Only show the celebratory gif if the texter is on the last message
  return (
    navigationToolbarChildren.currentIndex >= navigationToolbarChildren.total
  );
};

export class TexterSidebox extends React.Component {
  render() {
    const { settingsData } = this.props;
    return (
      <div>
        <img
          src={settingsData.animatedGifUrl}
          alt="Animated GIF To Celebrate Being Done Texting"
        />
      </div>
    );
  }
}

TexterSidebox.propTypes = {
  // data
  settingsData: type.object,

  // parent state
  disabled: type.bool,
  navigationToolbarChildren: type.object,
  messageStatusFilter: type.string
};

export const adminSchema = () => ({
  animatedGifUrl: yup.string().required()
});

export class AdminConfig extends React.Component {
  render() {
    return (
      <TextField
        floatingLabelText={"Link to animated Gif"}
        value={this.props.settingsData.animatedGifUrl}
        onChange={event => {
          this.props.onToggle("animatedGifUrl", event.target.value);
        }}
      />
    );
  }
}

AdminConfig.propTypes = {
  settingsData: type.object,
  onToggle: type.func
};
