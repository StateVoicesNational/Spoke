import React, { Component } from 'react'
import AutoComplete from 'material-ui/AutoComplete'
import { MenuItem } from 'material-ui/Menu'
import GSForm from '../components/forms/GSForm'
import yup from 'yup'
import Form from 'react-formal'
import Chip from './Chip'
import { RadioButton, RadioButtonGroup } from 'material-ui/RadioButton'
import CampaignFormSectionHeading from './CampaignFormSectionHeading'
import ContentClear from 'material-ui/svg-icons/content/clear'

const styles = {
  radioButtonGroup: {
    marginBottom: 12
  },
  autocomplete: {
    marginBottom: 24
  }
}

export default class CampaignTextersForm extends Component {

  handleNewRequest = (value) => {
    const { formValues } = this.props
    const { texters } = formValues
    // If you're searching but get no match, value is a string
    // representing your search term, but we only want to handle matches
    if (typeof(value) === 'object') {
      const texterId = value.value.key
      const newTexters = texters.concat([
        this.mapTexterIdToTexter(texterId)
      ])
      const { onChange } = this.props
      onChange({ texters: newTexters })
    }
  }

  onChange = (event, value) => {
    const { orgTexters, onChange } = this.props
    const texters = (value === 'assignAll') ? orgTexters : []
    onChange({ texters })
  }

  mapTexterIdToTexter(texterId) {
    return this.props.orgTexters.find((texter) => texter.id === texterId)
  }

  showTexters() {
    const { orgTexters, formValues } = this.props
    const { texters } = formValues

    const assignAll = texters.length === orgTexters.length
    const dataSource = orgTexters
      .filter((orgTexter) =>
        !texters.find((texter) => texter.id === orgTexter.id))
      .map((orgTexter) =>
          this.dataSourceItem(orgTexter.displayName,
          orgTexter.id
        )
    )

    const filter = (searchText, key) => (key === 'allTexters') ? true : AutoComplete.caseInsensitiveFilter(searchText, key)
    const valueSelected = assignAll ? 'assignAll' : 'assignIndividual'

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

    const radioButtonGroup = orgTexters.length === 0 ? '' : (
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
    if (this.props.ensureComplete) {
      return (
        <div>
          {texters.map((texter) => {
            return (
              <div style={{
                margin: 10,
                fontWeight: 600,
                lineHeight: '1.5em'
              }}>
                {`${texter.firstName}`}
              </div>
            )
          })}
        </div>
      )
    }
    return (
      <GSForm
        schema={yup.object({})}
        onSubmit={this.props.onSubmit}
      >
        {radioButtonGroup}
         <div>
           {texters.map((texter) => {
              return (
                <Chip
                  text={texter.firstName}
                  iconRightClass={ContentClear}
                  onIconRightTouchTap={() => this.removeTexter(texter.id)}
                />
              )
           })}
        </div>
        <Form.Button
          type='submit'
          disabled={this.props.saveDisabled}
          label={this.props.saveLabel}
        />
      </GSForm>
    )
  }

  removeTexter = (texterId) => {
    const { formValues, onChange } = this.props
    const { texters } = formValues
    const newTexters = texters.filter((texter) => texter.id !== texterId)
    onChange({ texters: newTexters })
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
    const { orgTexters, ensureComplete } = this.props
    let subtitle = orgTexters.length > 0 ? '' : 'You have no texters. Add some texters to your organization and come back!'
    if (ensureComplete) {
      subtitle = 'This campaign has already started so you cannot modify the texters on it. These are the texters currently assigned:'
    }
    return (
      <div>
        <CampaignFormSectionHeading
          title='Who should send the texts?'
          subtitle={subtitle}
        />
        {this.showTexters()}
      </div>
    )
  }
}
