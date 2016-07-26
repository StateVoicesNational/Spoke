import React from 'react'
import Form from 'react-formal'
import moment from 'moment'
import CampaignFormSectionHeading from './CampaignFormSectionHeading'
import GSForm from './forms/GSForm'
import yup from 'yup'

const FormSchema = {
  title: yup.string(),
  description: yup.string(),
  dueBy: yup.mixed()
}

const EnsureCompletedFormSchema = {
  title: yup.string().required(),
  description: yup.string().required(),
  dueBy: yup.mixed().required()
}

export default class CampaignBasicsForm extends React.Component {
  formValues() {
    return {
      ...this.props.formValues,
      dueBy: this.props.formValues.dueBy
    }
  }

  formSchema() {
    if (!this.props.ensureComplete) {
      return yup.object(FormSchema)
    }
    return yup.object(EnsureCompletedFormSchema)
  }

  render() {
    return (
      <div>
        <CampaignFormSectionHeading
          title="What's your campaign about?"
        />
        <GSForm
          schema={this.formSchema()}
          value={this.formValues()}
          onChange={this.props.onChange}
          onSubmit={this.props.onSubmit}
        >
          <Form.Field
            name='title'
            label='Title'
            hintText='e.g. Election Day 2016'
            fullWidth
          />
          <Form.Field
            name='description'
            label='Description'
            hintText='Get out the vote'
            fullWidth
          />
          <Form.Field
            name='dueBy'
            label='Due date'
            type='date'
            locale='en-US'
            shouldDisableDate={(date) => moment(date).diff(moment()) < 0}
            fullWidth
            utcOffset={0}
          />
          <Form.Button
            type='submit'
            label={this.props.saveLabel}
            disabled={this.props.saveDisabled}
          />
        </GSForm>
      </div>
    )
  }
}

CampaignBasicsForm.propTypes = {
  formValues: React.PropTypes.shape({
    title: React.PropTypes.string,
    description: React.PropTypes.string,
    dueBy: React.PropTypes.any
  }),
  onChange: React.PropTypes.func,
  onSubmit: React.PropTypes.func,
  saveLabel: React.PropTypes.string,
  saveDisabled: React.PropTypes.bool
}
