import React, { Component } from 'react'
import AutoComplete from 'material-ui/AutoComplete'
import { MenuItem } from 'material-ui/Menu'
import { Chip } from './chip'
import { RadioButton, RadioButtonGroup } from 'material-ui/RadioButton'
import { CampaignFormSectionHeading } from './campaign_form_section_heading'
import Divider from 'material-ui/Divider'
import ContentClear from 'material-ui/svg-icons/content/clear'
import Formsy from 'formsy-react'
import { FormsyText, FormsyDate } from 'formsy-material-ui/lib'
import Dialog from 'material-ui/Dialog'
import FlatButton from 'material-ui/FlatButton'
import RaisedButton from 'material-ui/RaisedButton'

const styles = {
  radioButtonGroup: {
    marginBottom: 12
  },
  autocomplete: {
    marginBottom: 24
  }
}

export class CampaignAssignmentForm extends Component {
  constructor(props) {
    super(props)
    this.handleNewRequest = this.handleNewRequest.bind(this)
    this.removeTexter = this.removeTexter.bind(this)
    this.onChange = this.onChange.bind(this)
  }

  handleNewRequest(value) {
    const { assignedTexters } = this.props
    // If you're searching but get no match, value is a string
    // representing your search term, but we only want to handle matches
    if (typeof(value) === 'object') {
      const texterId = value.value.key
      // TODO react addon for modifying immutable state
      const newAssignedTexters = assignedTexters.concat([texterId])
      const { onChange } = this.props
      onChange({ assignedTexters: newAssignedTexters })
    }
    console.log('clear search Text')
  }

  onChange(event, value) {
    const { texters, onChange } = this.props
    const assignedTexters = (value === 'assignAll') ? texters.map((texter) => texter._id) : []
    onChange({ assignedTexters })
  }

  removeTexter(texterId) {
    const { assignedTexters, onChange } = this.props
    onChange({ assignedTexters: _.without(assignedTexters, texterId) })
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
    const { texters, assignedTexters, onValid, onInvalid } = this.props

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
    // TODO : I have a dummy formsy field here just to enable/disable Next, but I should
    // actually probably do something smarter with the form submissions and getFormModel and do
    // multiple assignedTexters[0] fields, etc. Maybe custom components

    const valueSelected = assignAll ? 'assignAll' : 'assignIndividual'

    console.log("value selected", valueSelected)
    // TODO https://github.com/callemall/material-ui/pull/4193/commits/8e80a35e8d2cdb410c3727333e8518cadc08783b
    const autocomplete = (
      <AutoComplete
        ref="autocomplete"
        style={styles.autocomplete}
        autoFocus
        searchText=""
        filter={filter}
        hintText="Search for texters to assign"
        dataSource={dataSource}
        onNewRequest={this.handleNewRequest}
      />
    )

    const radioButtonGroup = texters.length === 0 ? '' : (
      [
        <RadioButtonGroup
          style={styles.radioButtonGroup}
          name="assignment"
          valueSelected={valueSelected}
          onChange={this.onChange}
        >
          <RadioButton
            value="assignAll"
            label="Everyone available"
          />
          <RadioButton
            value="assignIndividual"
            label="Choose individual people to assign"
          />
        </RadioButtonGroup>,
         !assignAll ? autocomplete : ''
      ]
    )
    const subtitle = texters.length > 0 ? '' : 'You have no texters set up. You can skip assignment for now and come back to add texters later.'
    return (
      <Formsy.Form
        onValid={onValid}
        onInvalid={onInvalid}
      >
        <CampaignFormSectionHeading
          title="Who should send the texts?"
          subtitle={subtitle}
        />
        { radioButtonGroup }
         <div>
          <FormsyText
            name="assignedTexters"
            style={{ opacity: 0, width: 0, height: 0 }}
            value={assignedTexters.length > 0 ? 'formsy-valid' : ''}
          />
           { assignedTexters.map((texterId) => {
             const user = Meteor.users.findOne({ _id: texterId })
             return (
                  <Chip
                    text={user.firstName}
                    iconRightClass={ContentClear}
                    onIconRightTouchTap={() => this.removeTexter(texterId)}
                  />
              )
           }) }
        </div>
      </Formsy.Form>
    )
  }
}
