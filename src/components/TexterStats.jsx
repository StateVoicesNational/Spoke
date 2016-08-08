import React from 'react'
import LinearProgress from 'material-ui/LinearProgress'

class TexterStats extends React.Component {
  renderAssignment(assignment) {
    console.log(assignment)
    const { contactsCount, unmessagedCount, texter } = assignment
    if (contactsCount === 0) {
      return <div />
    }

    const percentComplete = Math.round(((contactsCount - unmessagedCount) * 100) / contactsCount)

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
