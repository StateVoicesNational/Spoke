import React from "react";

import ThemeContext from "../context/ThemeContext";

const withSetTheme = WrappedComponent => {
  class WithSetTheme extends React.Component {
    render() {
      const { muiTheme } = this.context;
      return <WrappedComponent muiTheme={muiTheme} {...this.props} />;
    }
  }
  WithSetTheme.contextType = ThemeContext;

  return WithSetTheme;
};

export default withSetTheme;
