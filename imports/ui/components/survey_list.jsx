import React, { Component } from 'react'
import { QuestionDropdown } from './survey'
const styles = {
  base: {
    padding: '0px 24px',
    backgroundColor: '#E8F9FF'
  }
}

export class SurveyList extends Component {
  renderQuestion(survey) {
    const { onSurveyChange, contact } = this.props

    console.log("\nSURVEYS")
    console.log("answer", contact.surveyAnswer(survey._id))
    return <QuestionDropdown
      survey={survey}
      answer={contact.surveyAnswer(survey._id)}
      onSurveyChange={onSurveyChange}
    />
  }

  renderChildren(survey) {
    console.log("rendering children", survey._id)
    let children = survey.children().fetch()
    console.log(children)
    // TODO - his is wrong
    if(children) {
      children = children.filter((child) => child.answer == this.props.contact.surveyAnswer(survey._id))
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
        {this.renderQuestion(survey)}
        {this.renderChildren(survey)}
      </div>)
  }
}

SurveyList.propTypes = {
  survey: React.PropTypes.object,
  contact: React.PropTypes.object,
  onSurveyChange: React.PropTypes.function
}
