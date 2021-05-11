import PropTypes from "prop-types";
import React from "react";
import RaisedButton from "material-ui/RaisedButton";
import CircularProgress from "material-ui/CircularProgress";
import { getRaisedButtonProps } from "../utils";

const styles = {
  button: {
    marginTop: 15
  }
};

const GSSubmitButton = props => {
  let icon = "";
  const extraProps = {};
  if (props.isSubmitting) {
    extraProps.disabled = true;
    icon = (
      <CircularProgress
        size={0.5}
        style={{
          verticalAlign: "middle",
          display: "inline-block"
        }}
      />
    );
  }

  return (
    <div style={styles.button}>
      <RaisedButton
        primary
        type="submit"
        value="submit"
        {...getRaisedButtonProps(props)}
        {...extraProps}
      />
      {icon}
    </div>
  );
};

GSSubmitButton.propTypes = {
  isSubmitting: PropTypes.bool
};

export default GSSubmitButton;
