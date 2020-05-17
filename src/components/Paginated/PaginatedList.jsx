import type from "prop-types";
import React from "react";
import { List } from "material-ui/List";
import withPagination from "../Paginated/withPagination";

const PaginatedList = props => (
  <List style={{ width: "100%" }}>{props.children}</List>
);

PaginatedList.propTypes = {
  children: type.arrayOf(type.object)
};

export default withPagination(PaginatedList, true, true);
