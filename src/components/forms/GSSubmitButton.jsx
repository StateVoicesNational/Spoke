import PropTypes from "prop-types";
import React from "react";
import Button from "@material-ui/core/Button";
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
      <Button
        variant="contained"
        color="primary"
        type="submit"
        value="submit"
        {...getRaisedButtonProps(props)}
        {...extraProps}
      >
        {props.label}
      </Button>
      {icon}
    </div>
  );
};

GSSubmitButton.propTypes = {
  isSubmitting: PropTypes.bool
};

export default GSSubmitButton;
