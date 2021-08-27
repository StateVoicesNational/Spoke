import type from "prop-types";
import React from "react";
import * as yup from "yup";
import { css } from "aphrodite";
import Form from "react-formal";
import Button from "@material-ui/core/Button";

import GSTextField from "../../../components/forms/GSTextField";
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
      <div style={{ textAlign: "center" }}>
        <Button
          onClick={() => FreshworksWidget && FreshworksWidget("open")}
          className={css(flexStyles.flatButton)}
          style={inlineStyles.flatButtonLabel}
        >
          {settingsData.helpButtonLabel || "Help"}
        </Button>
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
  componentDidMount() {
    const { settingsData } = this.props;
    // set defaults
    const defaults = {};
    if (!settingsData.helpButtonLabel) {
      defaults.helpButtonLabel = "Help";
    }

    if (Object.values(defaults).length) {
      this.props.setDefaultsOnMount(defaults);
    }
  }

  render() {
    return (
      <div>
        <Form.Field
          as={GSTextField}
          name="helpButtonLabel"
          label="Help Button Label"
          fullWidth
        />
        <Form.Field
          as={GSTextField}
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
  onToggle: type.func,
  setDefaultsOnMount: type.func
};
