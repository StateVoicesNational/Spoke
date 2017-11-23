import React from 'react'
import Form from 'react-formal'
import moment from 'moment'
import CampaignFormSectionHeading from './CampaignFormSectionHeading'
import GSForm from './forms/GSForm'
import yup from 'yup'
import Toggle from 'material-ui/Toggle'
import ColorPicker from 'material-ui-color-picker'

const FormSchema = {
  title: yup.string(),
  description: yup.string(),
  dueBy: yup.mixed(),
  logoImageUrl: yup.string().url(),
  primaryColor: yup.string(),
  introHtml: yup.string()
}

const EnsureCompletedFormSchema = {
  title: yup.string().required(),
  description: yup.string().required(),
  dueBy: yup.mixed().required(),
  logoImageUrl: yup.string().transform(value => !value ? null : value).url().nullable(),
  primaryColor: yup.string().transform(value => !value ? null : value).nullable(),
  introHtml: yup.string().transform(value => !value ? null : value).nullable()
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
            autoOk
            fullWidth
            utcOffset={0}
          />
          <Form.Field
            name='introHtml'
            label='Intro HTML'
            multiLine
            fullWidth
          />
          <Form.Field
            name='logoImageUrl'
            label='Logo Image URL'
            hintText='https://www.mysite.com/images/logo.png'
            fullWidth
          />
          <label>Primary color</label>
          <Form.Field
            name='primaryColor'
            label='Primary color'
            defaultValue={this.props.formValues.primaryColor}
            type={ColorPicker}
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
    dueBy: React.PropTypes.any,
    logoImageUrl: React.PropTypes.string,
    primaryColor: React.PropTypes.string,
    introHtml: React.PropTypes.string
  }),
  onChange: React.PropTypes.func,
  onSubmit: React.PropTypes.func,
  saveLabel: React.PropTypes.string,
  saveDisabled: React.PropTypes.bool,
  ensureComplete: React.PropTypes.bool
}
