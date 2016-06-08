import React, { Component } from 'react'
import SelectField from 'material-ui/SelectField'
import MenuItem from 'material-ui/MenuItem'
import Formsy from 'formsy-react';
import { FormsySelect } from 'formsy-material-ui/lib'

const styles = {
  form: {
    padding: '0px 10px',
    backgroundColor: '#F8F8F8',
  },
}

export class QuestionDropdown extends Component {
  constructor(props) {
    super(props)
    this.handleAnswerChange = this.handleAnswerChange.bind(this)
  }

  handleAnswerChange(event, index, value) {
    const { onAnswerChange, question } = this.props
    console.log("event, value, index", question.allowedAnswers, value)
    const script = question.allowedAnswers.find((allowedAnswer) => allowedAnswer.value === value).script
    onAnswerChange(question._id, value, script)
  }

  render () {
    const { question, answer } = this.props
    return (
      <div style={styles.form}>
        <SelectField
          floatingLabelText={question.text}
          floatingLabelStyle={{pointerEvents: 'none'}} // https://github.com/callemall/material-ui/issues/3908
          onChange={this.handleAnswerChange}
          showUnderline={false}
          name={question.text}
          value={answer ? answer.value : ''}
        >
          {question.allowedAnswers.map(allowedAnswer =>
            <MenuItem
              key={allowedAnswer.value}
              value={allowedAnswer.value}
              primaryText={allowedAnswer.value}
            />)}
        </SelectField>
      </div>
    )
  }
}


QuestionDropdown.propTypes = {
  onAnswerChange: React.PropTypes.function,
  question: React.PropTypes.object,
  answer: React.PropTypes.object
}
