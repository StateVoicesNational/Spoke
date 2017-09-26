import React from 'react'
import Form from 'react-formal'
import moment from 'moment'
import CampaignFormSectionHeading from './CampaignFormSectionHeading'
import GSForm from './forms/GSForm'
import yup from 'yup'
import Toggle from 'material-ui/Toggle'

const FormSchema = {
  title: yup.string(),
  description: yup.string(),
  dueBy: yup.mixed(),
  useDynamicAssignment: yup.bool()
}

const EnsureCompletedFormSchema = {
  title: yup.string().required(),
  description: yup.string().required(),
  dueBy: yup.mixed().required(),
  useDynamicAssignment: yup.bool()
}

export default class CampaignBasicsForm extends React.Component {
  state = {
    useDynamicAssignment: this.formValues().useDynamicAssignment
  }

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

  handleToggleChange(){
    this.setState({
      useDynamicAssignment: !this.state.useDynamicAssignment
    })
    this.props.onChange({useDynamicAssignment: !this.state.useDynamicAssignment})
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
          <div>
            <Toggle
              label='Dynamically assign contacts'
              toggled={this.state.useDynamicAssignment}
              onToggle={this.handleToggleChange.bind(this)}
            />
          </div>
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
    useDynamicAssignment: React.PropTypes.bool
  }),
  onChange: React.PropTypes.func,
  onSubmit: React.PropTypes.func,
  saveLabel: React.PropTypes.string,
  saveDisabled: React.PropTypes.bool,
  ensureComplete: React.PropTypes.bool
}
