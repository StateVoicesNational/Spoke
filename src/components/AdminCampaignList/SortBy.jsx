import PropTypes from "prop-types";
import React from "react";
import DropDownMenu from "material-ui/DropDownMenu";
import MenuItem from "material-ui/MenuItem";
import ArrowDown from "material-ui/svg-icons/navigation/arrow-downward";
import ArrowUp from "material-ui/svg-icons/navigation/arrow-upward";
import ArrowRight from "material-ui/svg-icons/navigation/arrow-forward";

export const DUE_DATE_ASC_SORT = {
  display: (
    <span>
      Due Date, oldest
      <ArrowRight style={{ height: "13px" }} />
    </span>
  ),
  value: "DUE_DATE_ASC"
};

export const DUE_DATE_DESC_SORT = {
  display: (
    <span>
      Due Date, newest
      <ArrowRight style={{ height: "13px" }} />
    </span>
  ),
  value: "DUE_DATE_DESC"
};

export const ID_ASC_SORT = {
  display: (
    <span>
      Created, oldest
      <ArrowRight style={{ height: "13px" }} />
    </span>
  ),
  value: "ID_ASC"
};

export const ID_DESC_SORT = {
  display: (
    <span>
      Created, newest
      <ArrowRight style={{ height: "13px" }} />
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
  <DropDownMenu
    value={props.sortBy || DEFAULT_SORT_BY_VALUE}
    onChange={(event, index, value) => props.onChange(value)}
  >
    {SORTS.map(sort => (
      <MenuItem
        value={sort.value}
        key={sort.value}
        primaryText={<span>Sort: {sort.display}</span>}
      />
    ))}
  </DropDownMenu>
);

SortBy.propTypes = {
  sortBy: PropTypes.string,
  onChange: PropTypes.func
};

export default SortBy;
