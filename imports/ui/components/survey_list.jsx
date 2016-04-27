import React, { Component } from 'react'
import { SurveyQuestion } from './survey'

const styles = {
  base: {
    padding: '0px 24px',
    backgroundColor: '#E8F9FF'
  }
}

export class SurveyList extends Component {
  renderChildren(survey) {

    const children = survey.children().fetch()

    if(children) {
      return children.map((child) =>
        <SurveyQuestion
          survey={child}
          onSurveyChange={this.handleSurveyChange}
        />)
    }
    else {
      return ''
    }
  }

  render() {
    const { surveys } = this.props
    const survey = surveys[0]
    return (<div style={styles.base}>
        <SurveyQuestion survey={survey}
          onSurveyChange={this.handleSurveyChange}
        />
      {this.renderChildren(survey)}
    </div>)
  }
}

SurveyList.propTypes = {
  surveys: React.PropTypes.array
}
