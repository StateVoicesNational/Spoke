import PropTypes from "prop-types";
import React from "react";
import RaisedButton from "material-ui/RaisedButton";
import CircularProgress from "material-ui/CircularProgress";

const styles = {
  button: {
    marginTop: 15
  }
};

const GSSubmitButton = props => {
  let icon = "";
  const { isSubmitting, ...extraProps } = props;
  if (isSubmitting) {
    extraProps.disabled = true;
    icon = (
      <CircularProgress
        size={25}
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
