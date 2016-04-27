import React, { Component } from 'react'
import { SurveyQuestion } from './survey'

const styles = {
  base: {
    padding: '0px 24px',
    backgroundColor: '#E8F9FF'
  }
}

export class SurveyList extends Component {
  renderQuestion(survey) {
    const { onSurveyChange } = this.props
    return <SurveyQuestion
      survey={survey}
      onSurveyChange={onSurveyChange}
    />
  }

  renderChildren(survey) {
    let children = survey.children().fetch()
    // TODO - his is wrong
    if(children) {
      children = children.filter((child) => child.answer == survey.answer)

      return children.map((child) => this.renderQuestion(child))
    }
    else {
      return ''
    }
  }

  render() {
    const { survey } = this.props
    if (!survey) {
      return null
    }

    return (
      <div style={styles.base}>
        {this.renderQuestion(survey)})
        {this.renderChildren(survey)}
      </div>)
  }
}

SurveyList.propTypes = {
  survey: React.PropTypes.object
}
