import { css, StyleSheet } from "aphrodite";
import DropDownMenu from "material-ui/DropDownMenu";
import FlatButton from "material-ui/FlatButton";
import MenuItem from "material-ui/MenuItem";
import HardwareKeyboardArrowLeft from "material-ui/svg-icons/hardware/keyboard-arrow-left";
import HardwareKeyboardArrowRight from "material-ui/svg-icons/hardware/keyboard-arrow-right";
import PropTypes, { arrayOf } from "prop-types";
import React from "react";

const styles = StyleSheet.create({
  container: {
    paddingRight: "24px",
    display: "flex",
    flexDirection: "row",
    flexWrap: "nowrap",
    color: "#9E9E9E",
    fontSize: "13.5px",
    boxSizing: "border-box",
    height: "58px",
    justifyContent: "flex-end",
    alignItems: "center",
    minWidth: "100%"
  },
  borderTop: {
    borderTop: "1px solid #E1E4DF"
  },
  borderBottom: {
    borderBottom: "1px solid #E1E4DF"
  },
  menu: {
    paddingBottom: "9px"
  },
  buttons: {
    display: "flex",
    alignItems: "center",
    marginLeft: "8px",
    marginRight: "8px"
  },
  XOfY: {
    margin: "0px 8px"
  },
  rowsPerPage: {
    display: "flex",
    margin: "0px 8px",
    alignItems: "center"
  }
});

const inlineStyles = {
  inactiveMenuText: {
    color: "#9E9E9E"
  },
  button: {
    paddingTop: "3px",
    width: "36px",
    minWidth: "36px"
  },
  activeNavigationButtonColor: "#939AA1",
  inactiveNavigationButtonColor: "#DFE0E3"
};

const rowSizeList = props =>
  (props.rowSizeList && props.rowSizeList.length && props.rowSizeList) || [
    10,
    30,
    50,
    100
  ];

const rowSizeMenuItems = props =>
  rowSizeList(props).map(rowSize => (
    <MenuItem key={rowSize} value={rowSize} primaryText={rowSize} />
  ));

const numberOfFirstConvoOnPage = props => (props.page - 1) * props.rowSize + 1;
const conversationsCurrentlyDisplayed = props =>
  Math.min(numberOfFirstConvoOnPage(props) + props.rowSize - 1, props.count);
const pageXOfY = props =>
  `${numberOfFirstConvoOnPage(props)} - ${conversationsCurrentlyDisplayed(
    props
  )} of ${props.count}`;
const previousPageButtonDisabled = props => props.page === 1;
const nextPageButtonDisabled = props =>
  props.page * props.rowSize > props.count;

const TableToolbar = props => (
  <div
    className={css(
      styles.container,
      props.borderTop && styles.borderTop,
      props.borderBottom && styles.borderBottom
    )}
  >
    <div className={css(styles.rowsPerPage)}>
      <div>Rows per page:</div>
    </div>
    <DropDownMenu
      className={css(styles.menu)}
      value={props.rowSize || rowSizeList(props)[0]}
      onChange={(event, index, value) => props.onRowSizeChange(index, value)}
      labelStyle={inlineStyles.inactiveMenuText}
    >
      {rowSizeMenuItems(props)}
    </DropDownMenu>
    <div className={css(styles.XOfY)}>
      <div>{pageXOfY(props)}</div>
    </div>
    <div className={css(styles.buttons)}>
      <FlatButton
        disabled={previousPageButtonDisabled(props)}
        onClick={props.onPreviousPageClick}
        style={inlineStyles.button}
      >
        <HardwareKeyboardArrowLeft
          style={
            previousPageButtonDisabled(props)
              ? {
                  color: inlineStyles.inactiveNavigationButtonColor,
                  fill: inlineStyles.inactiveNavigationButtonColor
                }
              : {
                  color: inlineStyles.activeNavigationButtonColor,
                  fill: inlineStyles.activeNavigationButtonColor
                }
          }
        />
      </FlatButton>
      <FlatButton
        disabled={nextPageButtonDisabled(props)}
        onClick={props.onNextPageClick}
        style={inlineStyles.button}
      >
        <HardwareKeyboardArrowRight
          style={
            nextPageButtonDisabled(props)
              ? {
                  color: inlineStyles.inactiveNavigationButtonColor,
                  fill: inlineStyles.inactiveNavigationButtonColor
                }
              : {
                  color: inlineStyles.activeNavigationButtonColor,
                  fill: inlineStyles.activeNavigationButtonColor
                }
          }
        />
      </FlatButton>
    </div>
  </div>
);

TableToolbar.propTypes = {
  rowSizeList: arrayOf(PropTypes.number),
  rowSize: PropTypes.number.isRequired,
  page: PropTypes.number.isRequired,
  count: PropTypes.number.isRequired,
  onRowSizeChange: PropTypes.func.isRequired,
  onPreviousPageClick: PropTypes.func.isRequired,
  onNextPageClick: PropTypes.func.isRequired,
  borderBottom: PropTypes.bool,
  borderTop: PropTypes.bool
};

export default TableToolbar;
