import React, { PropTypes as type } from 'react'
import Slider from './Slider'
import AutoComplete from 'material-ui/AutoComplete'
import GSForm from '../components/forms/GSForm'
import yup from 'yup'
import Form from 'react-formal'
import { MenuItem } from 'material-ui/Menu'
import OrganizationJoinLink from './OrganizationJoinLink'
import { RadioButton, RadioButtonGroup } from 'material-ui/RadioButton'
import CampaignFormSectionHeading from './CampaignFormSectionHeading'
import { StyleSheet, css } from 'aphrodite'
import theme from '../styles/theme'

const styles = StyleSheet.create({
  sliderContainer: {
    border: `1px solid ${theme.colors.lightGray}`,
    padding: 10
  },
  texterRow: {
    display: 'flex',
    flexDirection: 'row'
  },
  nameColumn: {
    flex: '1 1 10%',
    textOverflow: 'ellipsis',
    marginTop: 'auto',
    marginBottom: 'auto',
    paddingRight: 10
  },
  slider: {
    flex: '1 70%',
    marginTop: 'auto',
    marginBottom: 'auto',
    paddingRight: 10
  },
  input: {
    flex: '1 1 20%',
    marginTop: 'auto',
    marginBottom: 'auto',
    display: 'inline-block'
  }
})

const inlineStyles = {
  autocomplete: {
    marginBottom: 24
  },
  radioButtonGroup: {
    marginBottom: 12
  },
  header: {
    ...theme.text.header,
    marginBottom: 20
  }
}

export default class CampaignTextersForm extends React.Component {

  removeTexter = (texterId) => {
    const { formValues, onChange } = this.props
    const { texters } = formValues
    const newTexters = texters.filter((texter) => texter.id !== texterId)
    onChange({ texters: newTexters })
  }

  dataSourceItem(name, key) {
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

  showSearch() {
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

    const filter = (searchText, key) => ((key === 'allTexters') ? true : AutoComplete.caseInsensitiveFilter(searchText, key))
    const valueSelected = assignAll ? 'assignAll' : 'assignIndividual'

    const autocomplete = (
      <AutoComplete
        ref='autocomplete'
        style={inlineStyles.autocomplete}
        autoFocus
        searchText=''
        filter={filter}
        hintText='Search for texters to assign'
        dataSource={dataSource}
        onNewRequest={(value) => {
          // If you're searching but get no match, value is a string
          // representing your search term, but we only want to handle matches
          if (typeof value === 'object') {
            const texterId = value.value.key
            const newTexter = this.props.orgTexters.find((texter) => texter.id === texterId)
            this.props.onChange({
              texters: [
                ...this.props.formValues.texters,
                {
                  id: texterId,
                  firstName: newTexter.firstName,
                  assignment: {
                    contactsCount: 0
                  }
                }
              ]
            })
          }
        }}
      />
    )

    return orgTexters.length === 0 ? '' : (
      <div>
        <RadioButtonGroup
          style={inlineStyles.radioButtonGroup}
          name='assignment'
          valueSelected={valueSelected}
          onChange={(event, value) => {
            let newTexters = []
            if (value === 'assignAll') {
              newTexters = this.props.orgTexters.map((orgTexter) => ({
                id: orgTexter.id,
                firstName: orgTexter.firstName,
                assignment: {
                  contactsCount: 0
                }
              }))
            }
            this.props.onChange({ texters: newTexters })
          }}
        >
          <RadioButton
            value='assignAll'
            label='Everyone available'
          />
          <RadioButton
            value='assignIndividual'
            label='Choose individual people to assign'
          />
        </RadioButtonGroup>
        {!assignAll ? autocomplete : ''}
      </div>
    )
  }

  showTexters() {
    return this.props.formValues.texters.map((texter, index) => {
      const messagedCount = texter.contactsCount - texter.needsMessageCount
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
            <Form.Field
              name={`texters[${index}].assignment.contactsCount`}
              hintText='Contacts'
            />
          </div>
        </div>
      )
    })
  }

  formSchema = yup.object({
    texters: yup.array().of(yup.object({
      id: yup.string(),
      assignment: yup.object({
        contactsCount: yup.number(),
        needsMessageCount: yup.number()
      })
    }))
  })

  onChange(formValues) {
    const existingFormValues = this.formValues()
    const newFormValues = {
      ...formValues
    }
    newFormValues.texters = newFormValues.texters.map((newTexter) => {
      const existingTexter = existingFormValues.filter((texter) => (texter.id === newTexter.id ? texter : null))[0]

      if (existingTexter.assignment.contactsCount !== newTexter.assignment.contactsCount) {
        const diff = existingTexter.assignment.contactsCount - newTexter.assignment.contactsCount
        const newNeedsMessageCount = newTexter.assignment.needsMessageCount - diff
        return {
          ...newTexter,
          assignment: {
            ...newTexter.assignment,
            needsMessageCount: newNeedsMessageCount
          }
        }
      }
      return newTexter
    })
  }

  formValues() {
    return {
      texters: this.props.formValues.texters.sort((texter1, texter2) => {
        if (texter1.firstName < texter2.firstName) {
          return -1
        } else if (texter1.firstName > texter2.firstName) {
          return 1
        }
        return 0
      })
    }
  }

  render() {
    const { organizationId } = this.props
    let subtitle = ''
    subtitle = (
      <div>
        <OrganizationJoinLink organizationId={organizationId} />
      </div>
    )
    const assignedContacts = this.props
      .formValues
      .texters
      .reduce(((prev, texter) => prev + texter.assignment.contactsCount), 0)

    const headerColor = assignedContacts === this.props.formValues.contactsCount ? theme.colors.green : theme.colors.orange
    return (
      <div>
        <CampaignFormSectionHeading
          title='Who should send the texts?'
          subtitle={subtitle}
        />
        <GSForm
          schema={this.formSchema}
          value={this.formValues()}
          onChange={this.onChange}
          onSubmit={this.props.onSubmit}
        >
          {this.showSearch()}
          <div className={css(styles.sliderContainer)}>
            <div
              style={{
                ...inlineStyles.header,
                color: headerColor
              }}
            >
              {`Assigned contacts: ${assignedContacts}/${this.props.formValues.contactsCount}`}
            </div>
              {this.showTexters()}
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

CampaignTextersForm.propTypes = {
  onChange: type.func,
  orgTexters: type.array,
  ensureComplete: type.bool,
  organizationId: type.string,
  formValues: type.object,
  contactsCount: type.number,
  onSubmit: type.func,
  saveLabel: type.string,
  saveDisabled: type.bool
}

