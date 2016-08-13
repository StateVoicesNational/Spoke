import React, { PropTypes as type } from 'react'
import Slider from './Slider'
import AutoComplete from 'material-ui/AutoComplete'
import { MenuItem } from 'material-ui/Menu'
import GSForm from '../components/forms/GSForm'
import yup from 'yup'
import Form from 'react-formal'
import Chip from './Chip'
import OrganizationJoinLink from './OrganizationJoinLink'
import { RadioButton, RadioButtonGroup } from 'material-ui/RadioButton'
import CampaignFormSectionHeading from './CampaignFormSectionHeading'
import ContentClear from 'material-ui/svg-icons/content/clear'
import GSTextField from '../components/forms/GSTextField'
import { StyleSheet, css } from 'aphrodite'

const styles = StyleSheet.create({
  texterRow: {
    display: 'flex',
    flexDirection: 'row'
  },
  nameColumn: {
    flex: '1 1 10%',
    textOverflow: 'ellipsis',
    paddingRight: 10
  },
  slider: {
    flex: '1 70%',
    paddingRight: 10
  },
  input: {
    flex: '1 1 20%',
    display: 'inline-block'
  }
})

const inlineStyles = {
  autocomplete: {
    marginBottom: 24
  },
  radioButtonGroup: {
    marginBottom: 12
  }
}
export default class CampaignTextersForm extends React.Component {

  onChange = (event, value) => {
    const { orgTexters, onChange } = this.props
    const texters = (value === 'assignAll') ? orgTexters : []
    onChange({ texters })
  }


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

  mapTexterIdToTexter(texterId) {
    return this.props.orgTexters.find((texter) => texter.id === texterId)
  }

/*
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
        ref='autocomplete'
        style={inlineStyles.autocomplete}
        autoFocus
        searchText=''
        filter={filter}
        hintText='Search for texters to assign'
        dataSource={dataSource}
        onNewRequest={this.handleNewRequest}
      />
    )

    const radioButtonGroup = orgTexters.length === 0 ? '' : (
    [
      <RadioButtonGroup
        style={inlineStyles.radioButtonGroup}
        name='assignment'
        valueSelected={valueSelected}
        onChange={this.onChange}
      >
          <RadioButton
            value='assignAll'
            label='Everyone available'
          />
          <RadioButton
            value='assignIndividual'
            label='Choose individual people to assign'
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
*/
  removeTexter = (texterId) => {
    const { formValues, onChange } = this.props
    const { texters } = formValues
    const newTexters = texters.filter((texter) => texter.id !== texterId)
    onChange({ texters: newTexters })
  }

  showTexters() {
    // Next step - turn this into a GSForm
    return this.props.formValues.texters.map((texter) => {
      const messagedCount = texter.needsResponseCount + texter.messagedCount + texter.closedCount
      return (
        <div className={css(styles.texterRow)}>
          <div className={css(styles.nameColumn)}>
            {`${texter.firstName}`}
          </div>
          <div className={css(styles.slider)}>
            <Slider
              minValue={messagedCount}
              maxValue={this.props.contactsCount}
              value={texter.assignment.contactsCount}
            />
          </div>
          <div className={css(styles.input)}>
            <GSTextField />
          </div>
        </div>
      )
    })
  }

  render() {
    const { organizationId } = this.props
    let subtitle = ''
    subtitle = (
      <div>
        <OrganizationJoinLink organizationId={organizationId} />
      </div>
    )
    return (
      <div>
        <CampaignFormSectionHeading
          title='Who should send the texts?'
          subtitle={subtitle}
        />
        <div>{`Total contacts to divide: ${this.props.formValues.contactsCount}`}</div>
        {this.showTexters()}
      </div>
    )
  }
}

CampaignTextersForm.propTypes = {
  onChange: type.func,
  orgTexters: type.array,
  ensureComplete: type.bool,
  organizationId: type.string,
  formValues: type.object,
  contactsCount: type.number
}

