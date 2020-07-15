import PropTypes from "prop-types";
import React from "react";
import LinearProgress from "material-ui/LinearProgress";
import { getHighestRole } from "../lib/permissions";

class TexterStats extends React.Component {
  renderAssignment(assignment) {
    const { contactsCount, unmessagedCount, texter, id } = assignment;
    if (contactsCount === 0) {
      return <div key={id} />;
    }

    const percentComplete = Math.round(
      ((contactsCount - unmessagedCount) * 100) / contactsCount
    );

    let displayName = `${texter.firstName} ${texter.lastName}`;
    if (getHighestRole(texter.roles) === "SUSPENDED") {
      displayName += " (Suspended)";
    }

    return (
      <div key={id}>
        {displayName}
        <div>{percentComplete}%</div>
        <LinearProgress mode="determinate" value={percentComplete} />
      </div>
    );
  }

  renderAssignmentDynamic(assignment) {
    const { contactsCount, unmessagedCount, texter, id } = assignment;
    if (contactsCount === 0) {
      return <div key={id} />;
    }

    return (
      <div key={id}>
        {texter.firstName}
        <div>{contactsCount - unmessagedCount} initial messages sent</div>
      </div>
    );
  }

  render() {
    const { campaign } = this.props;
    const { assignments } = campaign;
    return (
      <div>
        {assignments.map(assignment =>
          campaign.useDynamicAssignment
            ? this.renderAssignmentDynamic(assignment)
            : this.renderAssignment(assignment)
        )}
      </div>
    );
  }
}

TexterStats.propTypes = {
  campaign: PropTypes.object
};
export default TexterStats;
