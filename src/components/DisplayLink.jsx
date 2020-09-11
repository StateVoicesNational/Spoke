import PropTypes from "prop-types";
import React from "react";
import TextField from "material-ui/TextField";
import { dataTest } from "../lib/attributes";

const inlineStyles = {
  displayLabel: {
    display: "inline-block",
    fontWeight: "bold",
    marginRight: 10
  },
  fieldWithLabel: {
    display: "inline-block",
    width: "80%"
  }
};

const DisplayLink = ({ url, textContent, label }) => (
  <div>
    {textContent ? <div>{textContent}</div> : null}
    {label ? <label style={inlineStyles.displayLabel}>{label}</label> : null}
    <div style={label ? inlineStyles.fieldWithLabel : ""}>
      <TextField
        {...dataTest("url")}
        name={url}
        value={url}
        autoFocus
        onFocus={event => event.target.select()}
        fullWidth
      />
    </div>
  </div>
);

DisplayLink.propTypes = {
  url: PropTypes.string,
  textContent: PropTypes.string,
  label: PropTypes.string
};

export default DisplayLink;
