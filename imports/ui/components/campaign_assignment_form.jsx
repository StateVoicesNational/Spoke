import React, { Component } from 'react'
import AutoComplete from 'material-ui/AutoComplete'
import { MenuItem } from 'material-ui/Menu'
import { Chip } from './chip'
import {RadioButton, RadioButtonGroup} from 'material-ui/RadioButton';
import { CampaignFormSectionHeading } from './campaign_form_section_heading'
import Divider from 'material-ui/Divider'
import ContentClear from 'material-ui/svg-icons/content/clear'

const styles = {
  radioButtonGroup: {
    marginBottom: 12
  },
  autocomplete: {
    marginBottom: 24
  },
}
export class CampaignAssignmentForm extends Component {
  constructor(props) {
    super(props)
    this.handleNewRequest = this.handleNewRequest.bind(this)
    this.removeTexter = this.removeTexter.bind(this)
    this.onChange = this.onChange.bind(this)
  }

  removeTexter(texterId) {
    const { assignedTexters, onTexterAssignment } = this.props
    onTexterAssignment(_.without(assignedTexters, texterId))
  }
  handleNewRequest(value) {
    const { assignedTexters } = this.props
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

    const assignAll = assignedTexters.length === texters.length
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
        style={styles.autocomplete}
        autoFocus
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

        <RadioButtonGroup
          style={styles.radioButtonGroup}
          name="assignment"
          valueSelected={assignAll ? 'assignAll' : 'assignIndividual'}
          onChange={this.onChange}
        >
          <RadioButton
            value="assignAll"
            label="Assign all currently available texters"
          />
          <RadioButton
            value="assignIndividual"
            label="Choose individual people to assign"
          />
        </RadioButtonGroup>
       {assignAll ? '' : autocomplete}
       <div>
         { assignedTexters.map((texterId) => {
            const user = Meteor.users.findOne({_id: texterId})
            return (
                <Chip
                  text={user.firstName}
                  iconRightClass={ContentClear}
                  onIconRightTouchTap={() => this.removeTexter(texterId)}
                />
            )
         }) }
      </div>
      </div>
    )
  }
}
