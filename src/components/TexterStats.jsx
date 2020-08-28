import PropTypes from "prop-types";
import React from "react";
import { Link } from "react-router";
import LinearProgress from "material-ui/LinearProgress";
import { getHighestRole } from "../lib/permissions";

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

    return (
      <div key={id}>
        <Link
          to={`/admin/${this.props.organizationId}/incoming?campaigns=${campaign.id}&texterId=${texter.id}`}
        >
          {displayName}
        </Link>
        {percentComplete ? (
          <div>
            <div>{percentComplete}%</div>
            <LinearProgress mode="determinate" value={percentComplete} />
          </div>
        ) : (
          <div>
            {contactsCount - unmessagedCount} initial messages sent.{" "}
            {unmessagedCount ? (
              <Link
                to={`/admin/${this.props.organizationId}/incoming?campaigns=${campaign.id}&texterId=${texter.id}&messageStatus=needsMessage`}
              >
                Unmessaged: {unmessagedCount}
              </Link>
            ) : null}
          </div>
        )}
        {unrepliedCount ? (
          <div>
            {unrepliedCount} contacts{" "}
            <Link
              to={`/admin/${this.props.organizationId}/incoming?campaigns=${campaign.id}&texterId=${texter.id}&messageStatus=needsResponse`}
            >
              awaiting a reply
            </Link>
          </div>
        ) : null}
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
