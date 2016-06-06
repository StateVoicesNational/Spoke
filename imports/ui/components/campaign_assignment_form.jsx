import React, { Component } from 'react'
import AutoComplete from 'material-ui/AutoComplete'
import { MenuItem } from 'material-ui/Menu'
import { Chip } from './chip'
import {RadioButton, RadioButtonGroup} from 'material-ui/RadioButton';
import { CampaignFormSectionHeading } from './campaign_form_section_heading'

export class CampaignAssignmentForm extends Component {
  constructor(props) {
    super(props)
    this.handleNewRequest = this.handleNewRequest.bind(this)
  }

  handleNewRequest(value) {
    // If you're searching but get no match, value is a string
    // representing your search term, but we only want to handle matches
    if (typeof(value) === 'object') {
      const texterId = value.value.key
      // TODO react addon for modifying immutable state
      const newAssignedTexters = assignedTexters.concat([texterId])
      const { onTexterAssignment } = this.props
      onTexterAssignment(newAssignedTexters)
    }
  }

  onChange(event, value) {
    const { texters, onTexterAssignment } = this.props
    const assignedTexters = (value === 'assignAll') ? texters.map((texter) => texter._id) : []
    onTexterAssignment(assignedTexters)
  }

  dataSourceItem(name, key, image) {
    return {
      text: name,
      value: (
        <MenuItem
          key={key}
          primaryText={name}
        />
      )
    }
  }

  render() {
    const { texters, assignedTexters } = this.props
    // TODO remove already assigned texters
    const dataSource = texters.filter((texter) =>
        assignedTexters.indexOf(texter._id) === -1).map((texter) =>
          this.dataSourceItem(
          `${texter.firstName} ${texter.lastName}`,
          texter._id
        )
    )
    // TODO helper function for the names

    const filter = (searchText, key) => (key === 'allTexters') ? true : AutoComplete.caseInsensitiveFilter(searchText, key)

    // TODO https://github.com/callemall/material-ui/pull/4193/commits/8e80a35e8d2cdb410c3727333e8518cadc08783b
    const autocomplete = (
      <AutoComplete
        openOnFocus
        filter={filter}
        hintText="Search for texters to assign"
        dataSource={dataSource}
        onNewRequest={this.handleNewRequest}
      />
    )

    return (
      <div>
        <CampaignFormSectionHeading
          title='Who should send the texts?'
        />

        <RadioButtonGroup name="assignment" defaultSelected="assignAll">
          <RadioButton
            value="assignAll"
            label="Assign all currently available texters"
          />
          <RadioButton
            value="assignIndividual"
            label="Choose individual people to assign"
          />
        </RadioButtonGroup>
       {autocomplete}
       { assignedTexters.map((texterId) => {
          const user = Meteor.users.findOne({_id: texterId})
          return (
              <Chip
                text={user.firstName}
              />
          )
       }) }
      </div>
    )
  }
}
