import React from "react";
import DatePicker from "material-ui/DatePicker";
import moment from "moment";
import GSFormField from "./GSFormField";
import { dataTest } from "../../lib/attributes";

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
    const propCopy = {
      ...this.props
    };
    delete propCopy.value;
    delete propCopy.type;

    return (
      <DatePicker
        {...propCopy}
        floatingLabelText={this.floatingLabelText()}
        onChange={(_, date) => {
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
              moment().utcOffset() - this.props.utcOffset,
              "minutes"
            );
            this.props.onChange(newDate.toDate());
          }
        }}
        {...value}
        errorText={this.props.errorText}
      />
    );
  }
}
