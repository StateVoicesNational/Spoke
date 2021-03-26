import PropTypes from "prop-types";
import React, { Component } from "react";
import { StyleSheet, css } from "aphrodite";
import { setContrastingColor } from "../lib/color-contrast-helper";

import Button from "@material-ui/core/Button";
import Badge from "@material-ui/core/Badge";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardHeader from "@material-ui/core/CardHeader";

import { withRouter } from "react-router";
import { dataTest } from "../lib/attributes";
import AssignmentTexterFeedback from "../extensions/texter-sideboxes/texter-feedback/AssignmentTexterFeedback";

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
    height: 100
  }
});

export class AssignmentSummary extends Component {
  state = {
    badTimezoneTooltipOpen: false
  };

  goToTodos(contactsFilter, assignmentId) {
    const { organizationId, router, todoLink } = this.props;
    if (todoLink) {
      return todoLink(contactsFilter, assignmentId, router);
    }
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
    disabled,
    contactsFilter,
    hideIfZero,
    style,
    color
  }) {
    if (count === 0 && hideIfZero) {
      return "";
    }
    if (count === 0) {
      return (
        <Button
          {...dataTest(dataTestText)}
          disabled={disabled}
          variant="contained"
          color="primary"
          onClick={() => this.goToTodos(contactsFilter, assignment.id)}
        >
          {title}
        </Button>
      );
    } else {
      return (
        <Badge
          key={title}
          badgeContent={count || ""}
          color={disabled ? "default" : color}
        >
          <Button
            {...dataTest(dataTestText)}
            disabled={disabled}
            onClick={() => this.goToTodos(contactsFilter, assignment.id)}
            variant="outlined"
          >
            {title}
          </Button>
        </Badge>
      );
    }
  }

  render() {
    const { assignment, texter } = this.props;
    const {
      campaign,
      unmessagedCount,
      unrepliedCount,
      badTimezoneCount,
      pastMessagesCount,
      skippedMessagesCount,
      feedback
    } = assignment;
    const {
      id: campaignId,
      title,
      description,
      primaryColor,
      logoImageUrl,
      introHtml,
      texterUIConfig
    } = campaign;
    const settingsData = JSON.parse(
      (texterUIConfig && texterUIConfig.options) || "{}"
    );
    const sideboxProps = { assignment, campaign, texter, settingsData };
    const enabledSideboxes = getSideboxes(sideboxProps, "TexterTodoList");
    // if there's a sidebox marked popup, then we will only show that sidebox and little else
    const hasPopupSidebox = enabledSideboxes.popups.length;
    const sideboxList = enabledSideboxes
      .filter(sb =>
        hasPopupSidebox ? sb.name === enabledSideboxes.popups[0] : true
      )
      .map(sb => renderSummary(sb, settingsData, this, sideboxProps));
    const cardTitleTextColor = setContrastingColor(primaryColor);

    // NOTE: we bring back archived campaigns if they have feedback
    // but want to get rid of them once feedback is acknowledged
    if (campaign.isArchived && !hasPopupSidebox) return null;

    return (
      <div
        className={css(styles.container)}
        {...dataTest(`assignmentSummary-${campaignId}`)}
      >
        <Card>
          <CardHeader
            title={title}
            subheader={description}
            style={{
              backgroundColor: primaryColor,
              color: "#FFF"
            }}
            subheaderTypographyProps={{
              color: "inherit"
            }}
            avatar={
              logoImageUrl ? (
                <img src={logoImageUrl} className={css(styles.image)} />
              ) : null
            }
          />
          <CardContent>
            {introHtml ? (
              <div style={{ margin: "20px" }}>
                <div dangerouslySetInnerHTML={{ __html: introHtml }} />
              </div>
            ) : null}
            {(hasPopupSidebox && sideboxList) || null}

            {(window.NOT_IN_USA && window.ALLOW_SEND_ALL) || hasPopupSidebox
              ? null
              : this.renderBadgedButton({
                  dataTestText: "sendFirstTexts",
                  assignment,
                  title: "Send first texts",
                  count: unmessagedCount,
                  primary: true,
                  disabled: false,
                  contactsFilter: "text",
                  hideIfZero: true,
                  color: "primary"
                })}
            {(window.NOT_IN_USA && window.ALLOW_SEND_ALL) || hasPopupSidebox
              ? null
              : this.renderBadgedButton({
                  dataTestText: "Respond",
                  assignment,
                  title: "Respond",
                  count: unrepliedCount,
                  primary: false,
                  disabled: false,
                  contactsFilter: "reply",
                  hideIfZero: true,
                  color: "error"
                })}
            {this.renderBadgedButton({
              assignment,
              title: "Past Messages",
              count: pastMessagesCount,
              style: inlineStyles.pastMsgStyle,
              primary: false,
              disabled: false,
              contactsFilter: "stale",
              hideIfZero: true,
              color: "secondary"
            })}
            {this.renderBadgedButton({
              assignment,
              title: "Skipped Messages",
              count: skippedMessagesCount,
              style: inlineStyles.pastMsgStyle,
              primary: false,
              disabled: false,
              contactsFilter: "skipped",
              hideIfZero: true,
              color: "secondary"
            })}
            {window.NOT_IN_USA && window.ALLOW_SEND_ALL && !hasPopupSidebox
              ? this.renderBadgedButton({
                  assignment,
                  title: "Send messages",
                  primary: true,
                  disabled: false,
                  contactsFilter: "all",
                  count: 0,
                  hideIfZero: false,
                  color: "primary"
                })
              : ""}
            {this.renderBadgedButton({
              assignment,
              title: "Send later (outside timezone)",
              count: badTimezoneCount,
              primary: false,
              disabled: true,
              contactsFilter: null,
              hideIfZero: true,
              color: "secondary"
            })}
            {sideboxList.length && !hasPopupSidebox ? (
              <div style={{ paddingLeft: "14px", paddingBottom: "10px" }}>
                {sideboxList}
              </div>
            ) : null}

            {!sideboxList.length &&
            !unmessagedCount &&
            !unrepliedCount &&
            !pastMessagesCount &&
            !skippedMessagesCount &&
            !badTimezoneCount ? (
              <div style={{ padding: "0 20px 20px 20px" }}>Nothing to do</div>
            ) : null}
          </CardContent>
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
  refreshData: PropTypes.func,
  todoLink: PropTypes.func
};

export default withRouter(AssignmentSummary);
