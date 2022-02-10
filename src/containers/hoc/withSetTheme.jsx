import React from "react";

import ThemeContext from "../context/ThemeContext";

const withSetTheme = WrappedComponent => {
  class WithSetTheme extends React.Component {
    render() {
      const { muiTheme, setTheme } = this.context;
      return (
        <WrappedComponent
          setTheme={setTheme}
          muiTheme={muiTheme}
          {...this.props}
        />
      );
    }
  }
  WithSetTheme.contextType = ThemeContext;

  return WithSetTheme;
};

export default withSetTheme;
