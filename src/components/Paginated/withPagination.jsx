import type from "prop-types";
import { css, StyleSheet } from "aphrodite";
import React from "react";
import TableToolbar from "../TableToolbar";

const styles = StyleSheet.create({
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end"
  }
});

const WithPagination = (WrappedComponent, toolbarTop, toolbarBottom) => {
  const PaginatedComponent = props => (
    <div className={css(styles.container)}>
      {toolbarTop && (
        <TableToolbar
          page={props.page}
          rowSize={props.rowSize}
          rowSizeList={props.rowSizeList}
          count={props.count}
          onNextPageClick={props.onNextPageClick}
          onPreviousPageClick={props.onPreviousPageClick}
          onRowSizeChange={props.onRowSizeChange}
          borderBottom
        />
      )}
      <WrappedComponent {...props} />
      {toolbarBottom && (
        <TableToolbar
          page={props.page}
          rowSize={props.rowSize}
          rowSizeList={props.rowSizeList}
          count={props.count}
          onNextPageClick={props.onNextPageClick}
          onPreviousPageClick={props.onPreviousPageClick}
          onRowSizeChange={props.onRowSizeChange}
          borderTop
        />
      )}
    </div>
  );

  PaginatedComponent.propTypes = {
    page: type.number,
    rowSize: type.number,
    rowSizeList: type.arrayOf(type.number),
    count: type.number,
    onNextPageClick: type.func,
    onPreviousPageClick: type.func,
    onRowSizeChange: type.func
  };

  return PaginatedComponent;
};

export default WithPagination;
