import PropTypes from "prop-types";
import React from "react";

import ArrowForwardIcon from "@material-ui/icons/ArrowForward";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";

export const DUE_DATE_ASC_SORT = {
  display: (
    <span>
      Due Date, oldest
      <ArrowForwardIcon style={{ height: "13px" }} />
    </span>
  ),
  value: "DUE_DATE_ASC"
};

export const DUE_DATE_DESC_SORT = {
  display: (
    <span>
      Due Date, newest
      <ArrowForwardIcon style={{ height: "13px" }} />
    </span>
  ),
  value: "DUE_DATE_DESC"
};

export const ID_ASC_SORT = {
  display: (
    <span>
      Created, oldest
      <ArrowForwardIcon style={{ height: "13px" }} />
    </span>
  ),
  value: "ID_ASC"
};

export const ID_DESC_SORT = {
  display: (
    <span>
      Created, newest
      <ArrowForwardIcon style={{ height: "13px" }} />
    </span>
  ),
  value: "ID_DESC"
};

export const TITLE_SORT = {
  display: "Title",
  value: "TITLE"
};

export const TIMEZONE_SORT = {
  display: "Timezone",
  value: "TIMEZONE"
};

export const SORTS = [
  DUE_DATE_DESC_SORT,
  DUE_DATE_ASC_SORT,
  ID_DESC_SORT,
  ID_ASC_SORT,
  TITLE_SORT,
  TIMEZONE_SORT
];

export const DEFAULT_SORT_BY_VALUE = ID_ASC_SORT.value;

const SortBy = props => (
  <FormControl>
    <Select
      value={props.sortBy || DEFAULT_SORT_BY_VALUE}
      onChange={event => {
        props.onChange(event.target.value);
      }}
    >
      {SORTS.map(sort => (
        <MenuItem value={sort.value} key={sort.value}>
          Sort: {sort.display}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

SortBy.propTypes = {
  sortBy: PropTypes.string,
  onChange: PropTypes.func
};

export default SortBy;
