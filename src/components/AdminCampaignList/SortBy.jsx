import PropTypes from "prop-types";
import React from "react";
import DropDownMenu from "material-ui/DropDownMenu";
import MenuItem from "material-ui/MenuItem";

const DUE_DATE_ASC_SORT = {
  display: "Due Date - Earliest First",
  value: "DUE_DATE_ASC"
};

const DUE_DATE_DESC_SORT = {
  display: "Due Date - Latest First",
  value: "DUE_DATE_DESC"
};

export const ID_ASC_SORT = {
  display: "Created - Earliest First",
  value: "ID_ASC"
};

export const ID_DESC_SORT = {
  display: "Created - Latest First",
  value: "ID_DESC"
};

const TITLE_SORT = {
  display: "Title",
  value: "TITLE"
};

const SORTS = [
  DUE_DATE_ASC_SORT,
  DUE_DATE_DESC_SORT,
  ID_ASC_SORT,
  ID_DESC_SORT,
  TITLE_SORT
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
        primaryText={"Sort By " + sort.display}
      />
    ))}
  </DropDownMenu>
);

SortBy.propTypes = {
  sortBy: PropTypes.string,
  onChange: PropTypes.func
};

export default SortBy;
