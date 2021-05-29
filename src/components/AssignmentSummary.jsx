import PropTypes from "prop-types";
import React, { Component } from "react";
import { StyleSheet, css } from "aphrodite";
import { compose } from "recompose";

import Button from "@material-ui/core/Button";
import Badge from "@material-ui/core/Badge";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardHeader from "@material-ui/core/CardHeader";

import { setContrastingColor } from "../lib/color-contrast-helper";
import { withRouter } from "react-router";
import withMuiTheme from "../containers/hoc/withMuiTheme";
import { dataTest } from "../lib/attributes";
import {
  getSideboxes,
  renderSummary
} from "../extensions/texter-sideboxes/components";
import theme from "../styles/mui-theme";

const styles = StyleSheet.create({
  container: {
    margin: `${theme.spacing(2)}px 0`
  },
  image: {
    height: 100
  },
  buttonRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: theme.spacing(2),
    marginBottom: theme.spacing(2)
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
    hideBadge,
    color
  }) {
    if (count === 0 && hideIfZero) {
      return "";
    }
    if (count === 0 || hideBadge) {
      return (
        <Button
          {...dataTest(dataTestText)}
          disabled={disabled}
          variant="outlined"
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
          color={disabled ? "primary" : color}
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
    const cardTitleTextColor = setContrastingColor(
      primaryColor || this.props.muiTheme.palette.background.default
    );

    // NOTE: we bring back archived campaigns if they have feedback
    // but want to get rid of them once feedback is acknowledged
    if (campaign.isArchived && !hasPopupSidebox) return null;
    console.log("primaryColor", primaryColor);
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
              color: cardTitleTextColor
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
            {introHtml && (
              <div style={{ margin: "20px" }}>
                <div dangerouslySetInnerHTML={{ __html: introHtml }} />
              </div>
            )}
            {(hasPopupSidebox && sideboxList) || null}

            <div className={css(styles.buttonRow)}>
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
                title: pastMessagesCount
                  ? `Past ${pastMessagesCount} Messages`
                  : `Past Messages`,
                count: pastMessagesCount,
                primary: false,
                disabled: false,
                contactsFilter: "stale",
                hideIfZero: true,
                color: "secondary",
                hideBadge: true
              })}
              {this.renderBadgedButton({
                assignment,
                title: skippedMessagesCount
                  ? `Skipped ${skippedMessagesCount} Messages`
                  : `Skipped Messages`,
                count: skippedMessagesCount,
                primary: false,
                disabled: false,
                contactsFilter: "skipped",
                hideIfZero: true,
                color: "secondary",
                hideBadge: true
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
            </div>

            {sideboxList.length && !hasPopupSidebox ? (
              <div>{sideboxList}</div>
            ) : null}

            {!sideboxList.length &&
              !unmessagedCount &&
              !unrepliedCount &&
              !pastMessagesCount &&
              !skippedMessagesCount &&
              !badTimezoneCount && <div>Nothing to do</div>}
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

export default compose(withMuiTheme, withRouter)(AssignmentSummary);
