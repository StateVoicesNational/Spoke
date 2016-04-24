import React from 'react'
import FlatButton from 'material-ui/FlatButton';

export const Survey = ({question, answers}) => (
  <div>
    <p>{question}</p>
    {answers.map(answer => <FlatButton key={answer._id} label={answer.answer}/> )}
  </div>
)