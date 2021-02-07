import type from "prop-types";
import React from "react";
import yup from "yup";
import { css } from "aphrodite";
import Form from "react-formal";
import FlatButton from "material-ui/FlatButton";
import {
  flexStyles,
  inlineStyles
} from "../../../components/AssignmentTexter/StyleControls";

export const displayName = () => "Freshworks Widget";

export const showSidebox = () => true;

export class TexterSidebox extends React.Component {
  componentDidMount() {
    // A Freshworks widget integration has two components:
    // - a global function: `FreshworksWidget`
    // - a <script> tag at the end of our <body> with a script from Freshworks. This script
    // adds other DOM elements.
    // We will add these two objects to the DOM, then never touch them. Removing then re-adding
    // the script element adds duplicate DOM elements with every re-add.
    const { settingsData } = this.props;
    this.addGlobalFunction(settingsData.helpWidgetID);
    this.addScriptElement(settingsData.helpWidgetID);
    FreshworksWidget("hide", "launcher"); // Hide their button because it's in a weird spot.
  }

  addGlobalFunction = widgetId => {
    if (typeof window.FreshworksWidget !== "function") {
      window.fwSettings = { widget_id: widgetId };
      const n = (...args) => {
        n.q.push(args);
      };
      n.q = [];
      window.FreshworksWidget = n;
    }
  };

  addScriptElement = widgetId => {
    if (!document.getElementById("FreshworksScript")) {
      const script = document.createElement("script");
      script.type = "text/javascript";
      script.src = `https://widget.freshworks.com/widgets/${widgetId}.js`;
      script.async = true;
      script.defer = true;
      script.id = "FreshworksScript";
      document.body.appendChild(script);
    }
  };

  render() {
    const { settingsData } = this.props;

    return (
      <div>
        <FlatButton
          onClick={() => FreshworksWidget && FreshworksWidget("open")}
          label={settingsData.helpButtonLabel || "Help"}
          className={css(flexStyles.flatButton)}
          labelStyle={inlineStyles.flatButtonLabel}
        />
      </div>
    );
  }
}

TexterSidebox.propTypes = {
  settingsData: type.object
};

export const adminSchema = () => ({
  helpButtonLabel: yup.string(),
  helpWidgetID: yup.string()
});

export class AdminConfig extends React.Component {
  render() {
    return (
      <div>
        <Form.Field
          name="helpButtonLabel"
          label="Help Button Label"
          hintText="default: Help"
          fullWidth
        />
        <Form.Field
          name="helpWidgetID"
          label="Freshworks Widget ID"
          fullWidth
        />
      </div>
    );
  }
}

AdminConfig.propTypes = {
  settingsData: type.object,
  onToggle: type.func
};
