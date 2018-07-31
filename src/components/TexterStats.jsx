import PropTypes from 'prop-types'
import React from 'react'
import LinearProgress from '@material-ui/core/LinearProgress'

class TexterStats extends React.Component {
  renderAssignment(assignment) {
    const { contactsCount, unmessagedCount, texter, id } = assignment
    if (contactsCount === 0) {
      return <div key={id} />
    }

    const percentComplete = Math.round(((contactsCount - unmessagedCount) * 100) / contactsCount)

    return (
      <div key={id}>
        {texter.firstName} {texter.lastName}
        <div>{percentComplete}%</div>
        <LinearProgress
          min={0}
          max={100}
          variant='determinate'
          value={percentComplete}
        />
      </div>
    )
  }

  renderAssignmentDynamic(assignment) {
    const { contactsCount, unmessagedCount, texter, id } = assignment
    if (contactsCount === 0) {
      return <div key={id} />
    }

    return (
      <div key={id}>
        {texter.firstName}
        <div>{contactsCount - unmessagedCount} initial messages sent</div>
      </div>
    )
  }

  render() {
    const { campaign } = this.props
    const { assignments } = campaign
    return (
      <div>
        {assignments.map((assignment) => campaign.useDynamicAssignment ? this.renderAssignmentDynamic(assignment) : this.renderAssignment(assignment))}
      </div>
    )
  }
}

TexterStats.propTypes = {
  campaign: PropTypes.object
}
export default TexterStats
