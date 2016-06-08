import React, { Component } from 'react'
import Formsy from 'formsy-react'
import { FormsyText, FormsyDate } from 'formsy-material-ui/lib'
import { moment } from 'meteor/momentjs:moment'
import { CampaignFormSectionHeading } from './campaign_form_section_heading'

const styles = {
  hiddenInput: {
    opacity: 0
  }
}

export class CampaignBasicsForm extends Component {
  render() {
    const {
      title,
      description,
      dueBy,
      onValid,
      onInvalid,
      onTitleChange,
      onDescriptionChange,
      onDueByChange
    } = this.props

    return (
      <div>
        <CampaignFormSectionHeading
          title="What's your campaign about?"
        />
        <Formsy.Form
          ref="form"
          onValid={onValid}
          onInvalid={onInvalid}
        >
          <FormsyText
            fullWidth
            autoFocus
            required
            onChange={onTitleChange}
            name='title'
            value={title}
            hintText="e.g. Election Day 2016"
            floatingLabelText="Name"
          />
          <FormsyText
            name='description'
            fullWidth
            value={description}
            onChange={onDescriptionChange}
            hintText="Get out the vote"
            required
            floatingLabelText="Description"
          />
          <FormsyDate
            required
            name='dueBy'
            floatingLabelStyle={{pointerEvents: 'none'}} // https://github.com/callemall/material-ui/issues/3908
            floatingLabelText="Due date"
            onChange={onDueByChange}
            locale="en-US"
            shouldDisableDate={(date) => moment(date).diff(moment()) < 0 }
          />
          <input style={styles.hiddenInput} ref="hiddenInput" />
        </Formsy.Form>
      </div>
    )
  }

}
