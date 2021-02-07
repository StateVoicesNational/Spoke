import PropTypes from "prop-types";
import React from "react";
import { Link } from "react-router";
import ActionOpenInNew from "material-ui/svg-icons/action/open-in-new";
import LinearProgress from "material-ui/LinearProgress";
import { getHighestRole } from "../lib/permissions";
import theme from "../styles/theme";

class TexterStats extends React.Component {
  renderAssignment(assignment, campaign) {
    const {
      contactsCount,
      unmessagedCount,
      unrepliedCount,
      texter,
      id
    } = assignment;
    if (contactsCount === 0) {
      return <div key={id} />;
    }
    let percentComplete = null;

    if (!campaign.useDynamicAssignment) {
      percentComplete = Math.round(
        ((contactsCount - unmessagedCount) * 100) / contactsCount
      );
    }

    let displayName = `${texter.firstName} ${texter.lastName}`;
    if (getHighestRole(texter.roles) === "SUSPENDED") {
      displayName += " (Suspended)";
    }
    const bottomLinks = [
      <Link
        key={id}
        to={`/admin/${this.props.organizationId}/incoming?campaigns=${campaign.id}&texterId=${texter.id}`}
      >
        Review conversations
      </Link>
    ];

    if (unmessagedCount) {
      bottomLinks.push(
        <Link
          to={`/admin/${this.props.organizationId}/incoming?campaigns=${campaign.id}&texterId=${texter.id}&messageStatus=needsMessage`}
        >
          Unmessaged: {unmessagedCount}
        </Link>
      );
    }
    if (unrepliedCount) {
      bottomLinks.push(
        <span>
          {unrepliedCount} contacts{" "}
          <Link
            to={`/admin/${this.props.organizationId}/incoming?campaigns=${campaign.id}&texterId=${texter.id}&messageStatus=needsResponse`}
          >
            awaiting a reply
          </Link>
        </span>
      );
    }
    return (
      <div key={id}>
        <h3>
          {displayName}{" "}
          <Link
            target="_blank"
            to={`/app/${this.props.organizationId}/todos/other/${texter.id}`}
          >
            <ActionOpenInNew
              style={{ width: 14, height: 14, color: theme.colors.green }}
            />
          </Link>
        </h3>
        {percentComplete ? (
          <div>
            <div>{percentComplete}%</div>
            <LinearProgress mode="determinate" value={percentComplete} />
          </div>
        ) : (
          <div>{contactsCount - unmessagedCount} initial messages sent. </div>
        )}
        <div>
          {bottomLinks.map((link, i) => (
            <span key={`${texter.id}_${i}`}>
              {i ? <span>&nbsp;&nbsp;|&nbsp;&nbsp;</span> : null}
              {link}
            </span>
          ))}
        </div>
      </div>
    );
  }

  render() {
    const { campaign } = this.props;
    const { assignments } = campaign;
    return (
      <div>
        {assignments.map(assignment =>
          this.renderAssignment(assignment, campaign)
        )}
      </div>
    );
  }
}

TexterStats.propTypes = {
  campaign: PropTypes.object,
  organizationId: PropTypes.string
};
export default TexterStats;
