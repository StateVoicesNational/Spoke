import React, { Component } from 'react'
import SelectField from 'material-ui/SelectField'
import MenuItem from 'material-ui/MenuItem'
import Formsy from 'formsy-react';
import { FormsySelect } from 'formsy-material-ui/lib'

const styles = {
  form: {
    padding: '0 20px',
    backgroundColor: '#F8F8F8',
    width: '100%',
  },
  select: {
    fontSize: '12px'
  }
}

export class QuestionDropdown extends Component {
  constructor(props) {
    super(props)
    this.handleAnswerChange = this.handleAnswerChange.bind(this)
  }

  handleAnswerChange(event, value, index) {
    const { onAnswerChange, question } = this.props
    const script = question.allowedAnswers.find((allowedAnswer) => allowedAnswer.value === value).script
    onAnswerChange(question._id, value, script)
  }

  render () {
    const { question, answer } = this.props
    return (
      <Formsy.Form style={styles.form}>
        <FormsySelect
          floatingLabelText={question.text}
          floatingLabelStyle={{pointerEvents: 'none'}} // https://github.com/callemall/material-ui/issues/3908
          onChange={this.handleAnswerChange}
          showUnderline={false}
          fullWidth
          inputStyle={styles.select}
          name={question.text}
          value={answer ? answer.value : ''}
        >
          {question.allowedAnswers.map(allowedAnswer =>
            <MenuItem
              key={allowedAnswer.value}
              value={allowedAnswer.value}
              primaryText={allowedAnswer.value}
            />)}
        </FormsySelect>
      </Formsy.Form>
    )
  }
}


QuestionDropdown.propTypes = {
  onAnswerChange: React.PropTypes.function,
  question: React.PropTypes.object,
  answer: React.PropTypes.object
}
