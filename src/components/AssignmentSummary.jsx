import PropTypes from "prop-types";
import React, { Component } from "react";
import { Card, CardActions, CardTitle } from "material-ui/Card";
import { StyleSheet, css } from "aphrodite";
import loadData from "../containers/hoc/load-data";
import gql from "graphql-tag";
import RaisedButton from "material-ui/RaisedButton";
import Badge from "material-ui/Badge";
import moment from "moment";
import Divider from "material-ui/Divider";
import { withRouter } from "react-router";
import { dataTest } from "../lib/attributes";

const inlineStyles = {
  badge: {
    fontSize: 12,
    top: 20,
    right: 20,
    padding: "4px 2px 0px 2px",
    width: 20,
    textAlign: "center",
    verticalAlign: "middle",
    height: 20
  },
  pastMsgStyle: {
    backgroundColor: "#FFD700",
    fontSize: 12,
    top: 20,
    right: 20,
    padding: "4px 2px 0px 2px",
    width: 20,
    textAlign: "center",
    verticalAlign: "middle",
    height: 20
  }
};

const styles = StyleSheet.create({
  container: {
    margin: "20px 0"
  },
  image: {
    position: "absolute",
    height: "70%",
    top: "20px",
    right: "20px"
  }
});

export class AssignmentSummary extends Component {
  state = {
    badTimezoneTooltipOpen: false
  };

  goToTodos(contactsFilter, assignmentId) {
    const { organizationId, router } = this.props;

    if (contactsFilter) {
      router.push(
        `/app/${organizationId}/todos/${assignmentId}/${contactsFilter}`
      );
    }
  }

  renderBadgedButton({
    dataTestText,
    assignment,
    title,
    count,
    primary,
    disabled,
    contactsFilter,
    hideIfZero,
    style
  }) {
    if (count === 0 && hideIfZero) {
      return "";
    }
    if (count === 0) {
      return (
        <RaisedButton
          {...dataTest(dataTestText)}
          disabled={disabled}
          label={title}
          primary={primary && !disabled}
          onClick={() => this.goToTodos(contactsFilter, assignment.id)}
        />
      );
    } else {
      return (
        <Badge
          key={title}
          badgeStyle={style || inlineStyles.badge}
          badgeContent={count || ""}
          primary={primary && !disabled}
          secondary={!primary && !disabled}
        >
          <RaisedButton
            {...dataTest(dataTestText)}
            disabled={disabled}
            label={title}
            onClick={() => this.goToTodos(contactsFilter, assignment.id)}
          />
        </Badge>
      );
    }
  }

  detectHexBrightness(color) {
    let hexcolor = color.replace("#", "");
    if (hexcolor.length === 3) {
      hexcolor = hexcolor.replace(/(.)/g, "$1$1");
    }
    const r = parseInt(hexcolor.substr(0, 2), 16);
    const g = parseInt(hexcolor.substr(2, 2), 16);
    const b = parseInt(hexcolor.substr(4, 2), 16);

    const brightness = Math.floor((r * 299 + g * 587 + b * 114) / 1000);
    const threshhold = 130;

    return brightness > threshhold ? "light" : "dark";
  }

  detectRgbBrightness(color) {
    const colorValuesArray = color
      .slice(color.indexOf("(") + 1, color.indexOf(")"))
      .split(",");

    const r = parseInt(colorValuesArray[0]);
    const g = parseInt(colorValuesArray[1]);
    const b = parseInt(colorValuesArray[2]);
    const alpha = colorValuesArray[3]
      ? parseInt(colorValuesArray[3] * 100)
      : 100;

    const brightness = Math.floor((r * 299 + g * 587 + b * 114) / 1000);
    const threshhold = 130;

    return brightness > threshhold || alpha < 50 ? "light" : "dark";
  }

  detectHslBrightness(color) {
    let colorValuesArray = color
      .slice(color.indexOf("(") + 1, color.indexOf(")"))
      .replace(/(%)/g, "")
      .split(",");

    const brightness = parseInt(colorValuesArray[2]);
    const alpha = colorValuesArray[3]
      ? parseInt(colorValuesArray[3] * 100)
      : 100;

    const threshhold = 60;

    return brightness > threshhold || alpha < 50 ? "light" : "dark";
  }

  setContrastingColor(color) {
    let brightness;

    color[0] === "#"
      ? (brightness = this.detectHexBrightness(color))
      : color[0] === "h"
      ? (brightness = this.detectHslBrightness(color))
      : (brightness = this.detectRgbBrightness(color));

    return brightness === "dark" ? "rgb(255,255,255)" : "rgb(54, 67, 80)";
  }

  render() {
    const {
      assignment,
      unmessagedCount,
      unrepliedCount,
      badTimezoneCount,
      totalMessagedCount,
      pastMessagesCount,
      skippedMessagesCount
    } = this.props;
    const {
      title,
      description,
      hasUnassignedContactsForTexter,
      dueBy,
      primaryColor,
      logoImageUrl,
      introHtml,
      useDynamicAssignment
    } = assignment.campaign;
    const maxContacts = assignment.maxContacts;

    const cardTitleTextColor = this.setContrastingColor(primaryColor);

    return (
      <div className={css(styles.container)}>
        <Card key={assignment.id}>
          <CardTitle
            title={title}
            titleStyle={{ color: cardTitleTextColor }}
            subtitle={`${description} - ${moment(dueBy).format("MMM D YYYY")}`}
            subtitleStyle={{ color: cardTitleTextColor }}
            style={{
              backgroundColor: primaryColor
            }}
            children={
              logoImageUrl ? (
                <img src={logoImageUrl} className={css(styles.image)} />
              ) : (
                ""
              )
            }
          />
          <Divider />
          <div style={{ margin: "20px" }}>
            <div dangerouslySetInnerHTML={{ __html: introHtml }} />
          </div>
          <CardActions>
            {window.NOT_IN_USA && window.ALLOW_SEND_ALL
              ? ""
              : this.renderBadgedButton({
                  dataTestText: "sendFirstTexts",
                  assignment,
                  title: "Send first texts",
                  count: unmessagedCount,
                  primary: true,
                  disabled:
                    (useDynamicAssignment &&
                      !hasUnassignedContactsForTexter &&
                      unmessagedCount == 0) ||
                    (useDynamicAssignment && maxContacts === 0),
                  contactsFilter: "text",
                  hideIfZero: !useDynamicAssignment
                })}
            {window.NOT_IN_USA && window.ALLOW_SEND_ALL
              ? ""
              : this.renderBadgedButton({
                  dataTestText: "sendReplies",
                  assignment,
                  title: "Send replies",
                  count: unrepliedCount,
                  primary: false,
                  disabled: false,
                  contactsFilter: "reply",
                  hideIfZero: true
                })}
            {this.renderBadgedButton({
              assignment,
              title: "Past Messages",
              count: pastMessagesCount,
              style: inlineStyles.pastMsgStyle,
              primary: false,
              disabled: false,
              contactsFilter: "stale",
              hideIfZero: true
            })}
            {this.renderBadgedButton({
              assignment,
              title: "Skipped Messages",
              count: skippedMessagesCount,
              style: inlineStyles.pastMsgStyle,
              primary: false,
              disabled: false,
              contactsFilter: "skipped",
              hideIfZero: true
            })}
            {window.NOT_IN_USA && window.ALLOW_SEND_ALL
              ? this.renderBadgedButton({
                  assignment,
                  title: "Send messages",
                  primary: true,
                  disabled: false,
                  contactsFilter: "all",
                  count: 0,
                  hideIfZero: false
                })
              : ""}
            {this.renderBadgedButton({
              assignment,
              title: "Send later",
              count: badTimezoneCount,
              primary: false,
              disabled: true,
              contactsFilter: null,
              hideIfZero: true
            })}
          </CardActions>
        </Card>
      </div>
    );
  }
}

AssignmentSummary.propTypes = {
  organizationId: PropTypes.string,
  router: PropTypes.object,
  assignment: PropTypes.object,
  unmessagedCount: PropTypes.number,
  unrepliedCount: PropTypes.number,
  badTimezoneCount: PropTypes.number,
  totalMessagedCount: PropTypes.number,
  pastMessagesCount: PropTypes.number,
  skippedMessagesCount: PropTypes.number,
  data: PropTypes.object,
  mutations: PropTypes.object
};

export default withRouter(AssignmentSummary);
