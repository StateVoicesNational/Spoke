import "date-fns";
import React from "react";
import moment from "moment";
import GSFormField from "./GSFormField";
import { dataTest } from "../../lib/attributes";
import DateFnsUtils from "@date-io/date-fns";
import {
  MuiPickersUtilsProvider,
  KeyboardDatePicker,
  DatePicker
} from "@material-ui/pickers";

export default class GCDateField extends GSFormField {
  render() {
    const momentDate = moment(this.props.value);
    let value = {};
    let oldDate = null;
    if (momentDate.isValid()) {
      const fakeDate = momentDate
        .add(this.props.utcOffset - moment().utcOffset(), "minutes")
        .toDate();
      oldDate = moment(fakeDate).toObject();
      value = { value: fakeDate };
    }
    const { utcOffset } = this.props;
    const propCopy = {
      ...this.props
    };
    delete propCopy.utcOffset;
    delete propCopy.value;
    delete propCopy.type;

    return (
      <MuiPickersUtilsProvider utils={DateFnsUtils}>
        <DatePicker
          fullWidth
          format="MM/dd/yyyy"
          label={this.floatingLabelText()}
          value={value.value}
          onChange={date => {
            let newDate = moment(date);
            if (!newDate.isValid()) {
              this.props.onChange(null);
            } else {
              newDate = newDate.toObject();
              if (oldDate) {
                newDate.hours = oldDate.hours;
                newDate.minutes = oldDate.minutes;
                newDate.seconds = oldDate.seconds;
              }
              newDate = moment(newDate).add(
                moment().utcOffset() - utcOffset,
                "minutes"
              );
              this.props.onChange(newDate.toDate());
            }
          }}
        />
      </MuiPickersUtilsProvider>
    );
  }
}
