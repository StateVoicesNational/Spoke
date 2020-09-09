import PropTypes from "prop-types";
import React from "react";
import theme from "../styles/theme";
import { css } from "aphrodite";
import { styles } from "../containers/Home";

class Downtime extends React.Component {
  render() {
    return (
      <div className={css(styles.container)}>
        <div className={css(styles.logoDiv)}>
          <img
            src="https://s3-us-west-1.amazonaws.com/spoke-public/spoke_logo.svg?downtime"
            className={css(styles.logoImg)}
          />
        </div>
        <div className={css(styles.content)}>
          {window.DOWNTIME || window.DOWNTIME_TEXTER ? (
            <div>
              Spoke is not currently available.
              {window.DOWNTIME &&
              window.DOWNTIME != "1" &&
              window.DOWNTIME != "true" ? (
                <div>{window.DOWNTIME}</div>
              ) : (
                "Please talk to your campaign manager or system administrator."
              )}
              {window.DOWNTIME_TEXTER &&
              window.DOWNTIME_TEXTER != "1" &&
              window.DOWNTIME_TEXTER != "true" ? (
                <div>{window.DOWNTIME_TEXTER}</div>
              ) : null}
            </div>
          ) : (
            <div>
              This page is where Spoke users are brought to when the system is
              set to DOWNTIME=true for maintenance, etc.
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default Downtime;
