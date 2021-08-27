import "date-fns";
import React from "react";
import moment from "moment";
import GSFormField from "./GSFormField";
import { dataTest } from "../../lib/attributes";
import DateFnsUtils from "@date-io/date-fns";
import {
  MuiPickersUtilsProvider,
  KeyboardDatePicker
} from "@material-ui/pickers";
import theme from "../../styles/mui-theme";

export default class GSDateField extends GSFormField {
  state = { open: false };

  render() {
    return (
      <MuiPickersUtilsProvider utils={DateFnsUtils}>
        <KeyboardDatePicker
          fullWidth
          onKeyPress={evt => {
            this.setState({ open: true });
            evt.preventDefault();
          }}
          onClose={() => this.setState({ open: false })}
          onOpen={() => this.setState({ open: true })}
          autoOk
          format="MM/dd/yyyy"
          label={this.floatingLabelText()}
          style={{
            marginBottom: theme.spacing(2)
          }}
          open={this.state.open}
          {...this.props}
        />
      </MuiPickersUtilsProvider>
    );
  }
}
