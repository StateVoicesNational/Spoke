import PropTypes from "prop-types";
import React from "react";
import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import { getButtonProps } from "../utils";

const styles = {
  button: {
    marginTop: 15,
    display: "inline-block"
  }
};

const GSSubmitButton = props => {
  let icon = "";
  const extraProps = {};
  if (props.isSubmitting) {
    extraProps.disabled = true;
    icon = (
      <CircularProgress
        size={20}
        style={{
          verticalAlign: "middle",
          display: "inline-block",
          marginLeft: "5px"
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
        {...getButtonProps(props)}
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
