import PropTypes from "prop-types";
import React, { Component } from "react";
import { Card, CardActions, CardTitle } from "material-ui/Card";
import { StyleSheet, css } from "aphrodite";
import loadData from "../containers/hoc/load-data";
import { setContrastingColor } from "../lib/color-contrast-helper";
import gql from "graphql-tag";
import RaisedButton from "material-ui/RaisedButton";
import Badge from "material-ui/Badge";
import moment from "moment";
import Divider from "material-ui/Divider";
import { withRouter } from "react-router";
import { dataTest } from "../lib/attributes";

import {
  getSideboxes,
  renderSummary
} from "../extensions/texter-sideboxes/components";

export const inlineStyles = {
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

  render() {
    const { assignment, texter } = this.props;
    const {
      campaign,
      hasUnassignedContactsForTexter,
      unmessagedCount,
      unrepliedCount,
      badTimezoneCount,
      totalMessagedCount,
      pastMessagesCount,
      skippedMessagesCount
    } = assignment;
    const {
      id: campaignId,
      title,
      description,
      primaryColor,
      logoImageUrl,
      introHtml,
      texterUIConfig,
      useDynamicAssignment
    } = campaign;
    const settingsData = JSON.parse(
      (texterUIConfig && texterUIConfig.options) || "{}"
    );
    const sideboxProps = { assignment, campaign, texter, settingsData };
    const enabledSideboxes = getSideboxes(sideboxProps, "TexterTodoList");
    const sideboxList = enabledSideboxes.map(sb =>
      renderSummary(sb, settingsData, this, sideboxProps)
    );
    const cardTitleTextColor = setContrastingColor(primaryColor);

    return (
      <div
        className={css(styles.container)}
        {...dataTest(`assignmentSummary-${campaignId}`)}
      >
        <Card key={assignment.id}>
          <CardTitle
            title={title}
            titleStyle={{ color: cardTitleTextColor }}
            subtitle={description}
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
          {introHtml ? (
            <div style={{ margin: "20px" }}>
              <div dangerouslySetInnerHTML={{ __html: introHtml }} />
            </div>
          ) : null}
          <CardActions>
            {window.NOT_IN_USA && window.ALLOW_SEND_ALL
              ? ""
              : this.renderBadgedButton({
                  dataTestText: "sendFirstTexts",
                  assignment,
                  title: "Send first texts",
                  count: unmessagedCount,
                  primary: true,
                  disabled: false,
                  contactsFilter: "text",
                  hideIfZero: true
                })}
            {window.NOT_IN_USA && window.ALLOW_SEND_ALL
              ? ""
              : this.renderBadgedButton({
                  dataTestText: "Respond",
                  assignment,
                  title: "Respond",
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
              title: "Send later (outside timezone)",
              count: badTimezoneCount,
              primary: false,
              disabled: true,
              contactsFilter: null,
              hideIfZero: true
            })}
            {sideboxList.length ? (
              <div style={{ paddingLeft: "14px", paddingBottom: "10px" }}>
                {sideboxList}
              </div>
            ) : null}
          </CardActions>
          {!sideboxList.length &&
          !unmessagedCount &&
          !unrepliedCount &&
          !pastMessagesCount &&
          !skippedMessagesCount &&
          !badTimezoneCount ? (
            <div style={{ padding: "0 20px 20px 20px" }}>Nothing to do</div>
          ) : null}
          }
        </Card>
      </div>
    );
  }
}

AssignmentSummary.propTypes = {
  organizationId: PropTypes.string,
  router: PropTypes.object,
  assignment: PropTypes.object,
  texter: PropTypes.object,
  refreshData: PropTypes.func
};

export default withRouter(AssignmentSummary);
