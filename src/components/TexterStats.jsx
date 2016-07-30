import React from 'react'
import LinearProgress from 'material-ui/LinearProgress'

class TexterStats extends React.Component {
  renderAssignment(assignment) {
    const { contacts, texter } = assignment
    const { unmessagedCount, count } = contacts

    const percentComplete = ((count - unmessagedCount) * 100) / count

    return (
      <div>
        {texter.firstName}
        <div>{percentComplete}%</div>
        <LinearProgress
          mode='determinate'
          value={percentComplete}
        />
      </div>
    )
  }

  render() {
    const { campaign } = this.props
    const { assignments } = campaign
    return (
      <div>
        {assignments.map((assignment) => this.renderAssignment(assignment))}
      </div>
    )
  }
}

TexterStats.propTypes = {
  campaign: React.PropTypes.object
}
export default TexterStats
