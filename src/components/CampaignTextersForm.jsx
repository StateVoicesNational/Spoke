import React, { PropTypes as type } from 'react'
import Slider from './Slider'
import AutoComplete from 'material-ui/AutoComplete'
import IconButton from 'material-ui/IconButton'
import GSForm from '../components/forms/GSForm'
import yup from 'yup'
import Form from 'react-formal'
import { MenuItem } from 'material-ui/Menu'
import OrganizationJoinLink from './OrganizationJoinLink'
import CampaignFormSectionHeading from './CampaignFormSectionHeading'
import { StyleSheet, css } from 'aphrodite'
import theme from '../styles/theme'
import Toggle from 'material-ui/Toggle'
import DeleteIcon from 'material-ui/svg-icons/action/delete'

const styles = StyleSheet.create({
  sliderContainer: {
    border: `1px solid ${theme.colors.lightGray}`,
    padding: 10,
    borderRadius: 8
  },
  removeButton: {
    width: 50
  },
  texterRow: {
    display: 'flex',
    flexDirection: 'row'
  },
  alreadyTextedHeader: {
    textAlign: 'right',
    fontWeight: 600,
    fontSize: 16
  },
  availableHeader: {
    fontWeight: 600,
    fontSize: 16
  },
  nameColumn: {
    width: 100,
    textOverflow: 'ellipsis',
    marginTop: 'auto',
    marginBottom: 'auto',
    paddingRight: 10
  },
  splitToggle: {
    ...theme.text.body,
    flex: '1 1 50%'
  },
  slider: {
    flex: '1 1 35%',
    marginTop: 'auto',
    marginBottom: 'auto',
    paddingRight: 10
  },
  leftSlider: {
    flex: '1 1 35%',
    marginTop: 'auto',
    marginBottom: 'auto',
    paddingRight: 10
  },
  headerContainer: {
    display: 'flex',
    borderBottom: `1px solid ${theme.colors.lightGray}`,
    marginBottom: 20
  },
  assignedCount: {
    width: 40,
    fontSize: 16,
    paddingLeft: 5,
    paddingRight: 5,
    textAlign: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
    marginRight: 10,
    display: 'inline-block',
    backgroundColor: theme.colors.lightGray
  },
  input: {
    width: 50,
    paddingLeft: 0,
    paddingRight: 0,
    marginRight: 10,
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
    ...theme.text.header
  }
}

export default class CampaignTextersForm extends React.Component {
  state = {
    autoSplit: false,
    focusedTexter: null
  }

  onChange = (formValues) => {
    const existingFormValues = this.formValues()
    const changedTexter = this.state.focusedTexter
    const newFormValues = {
      ...formValues
    }
    let totalNeedsMessage = 0
    let totalMessaged = 0
    const texterCountChanged = newFormValues.texters.length !== existingFormValues.texters.length
    newFormValues.texters = newFormValues.texters.map((newTexter) => {
      const existingTexter = existingFormValues.texters.filter((texter) => (texter.id === newTexter.id ? texter : null))[0]
      let messagedCount = 0
      if (existingTexter) {
        messagedCount = existingTexter.assignment.contactsCount - existingTexter.assignment.needsMessageCount
        totalMessaged += messagedCount
      }

      let convertedNeedsMessageCount = parseInt(newTexter.assignment.needsMessageCount, 10)
      if (isNaN(convertedNeedsMessageCount)) {
        convertedNeedsMessageCount = 0
      }
      if (convertedNeedsMessageCount + messagedCount > this.formValues().contactsCount) {
        convertedNeedsMessageCount = this.formValues().contactsCount - messagedCount
      }

      if (convertedNeedsMessageCount < 0) {
        convertedNeedsMessageCount = 0
      }

      if (texterCountChanged && this.state.autoSplit) {
        convertedNeedsMessageCount = 0
      }

      totalNeedsMessage = totalNeedsMessage + convertedNeedsMessageCount

      return {
        ...newTexter,
        assignment: {
          ...newTexter.assignment,
          contactsCount: convertedNeedsMessageCount + messagedCount,
          needsMessageCount: convertedNeedsMessageCount
        }
      }
    })

    let extra = totalNeedsMessage + totalMessaged - this.formValues().contactsCount
    if (extra > 0) {
      let theTexter = newFormValues.texters[0]
      if (changedTexter) {
        theTexter = newFormValues.texters.find((ele) => ele.id === changedTexter)
      }

      newFormValues.texters = newFormValues.texters.map((texter) => {
        const newTexter = texter
        const messagedCount = texter.assignment.contactsCount - texter.assignment.needsMessageCount
        if (texter.id === theTexter.id) {
          newTexter.assignment.needsMessageCount = this.formValues().contactsCount - totalMessaged
        } else {
          newTexter.assignment.needsMessageCount = 0
        }
        newTexter.assignment.contactsCount = texter.assignment.needsMessageCount + messagedCount
        return newTexter
      })
    } else {
      const factor = 1
      let index = 0
      let skipsByIndex = new Array(newFormValues.texters.length).fill(0)
      if (newFormValues.texters.length === 1 && this.state.autoSplit) {
        const messagedCount = newFormValues.texters[0].assignment.contactsCount - newFormValues.texters[0].assignment.needsMessageCount
        newFormValues.texters[0].assignment.contactsCount = this.formValues().contactsCount
        newFormValues.texters[0].assignment.needsMessageCount = this.formValues().contactsCount - messagedCount
      } else if (newFormValues.texters.length > 1 && (extra > 0 || (extra < 0 && this.state.autoSplit))) {
        while (extra !== 0) {
          const texter = newFormValues.texters[index]
          if (skipsByIndex[index] < texter.assignment.contactsCount - texter.assignment.needsMessageCount) {
            skipsByIndex[index]++
          } else {
            if (!changedTexter || texter.id !== changedTexter) {
              if (texter.assignment.needsMessageCount + factor >= 0) {
                texter.assignment.needsMessageCount = texter.assignment.needsMessageCount + factor
                texter.assignment.contactsCount = texter.assignment.contactsCount + factor
                extra = extra + factor
              }
            }
          }
          index = index + 1
          if (index >= newFormValues.texters.length) {
            index = 0
          }
        }
      }
    }

    this.props.onChange(newFormValues)
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

  formSchema = yup.object({
    texters: yup.array().of(yup.object({
      id: yup.string(),
      assignment: yup.object({
        needsMessageCount: yup.string()
      })
    }))
  })

  formValues() {
    return {
      ...this.props.formValues,
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

  showSearch() {
    const { orgTexters } = this.props
    const { texters } = this.formValues()

    const dataSource = orgTexters
      .filter((orgTexter) =>
        !texters.find((texter) => texter.id === orgTexter.id))
      .map((orgTexter) =>
          this.dataSourceItem(orgTexter.displayName,
          orgTexter.id
        )
    )

    const filter = (searchText, key) => ((key === 'allTexters') ? true : AutoComplete.caseInsensitiveFilter(searchText, key))

    const autocomplete = (
      <AutoComplete
        ref='autocomplete'
        style={inlineStyles.autocomplete}
        autoFocus
        onFocus={() => this.setState({ searchText: '' })}
        onUpdateInput={(searchText) => this.setState({ searchText })}
        searchText={this.state.searchText}
        filter={filter}
        hintText='Search for texters to assign'
        dataSource={dataSource}
        onNewRequest={(value) => {
          // If you're searching but get no match, value is a string
          // representing your search term, but we only want to handle matches
          if (typeof value === 'object') {
            const texterId = value.value.key
            const newTexter = this.props.orgTexters.find((texter) => texter.id === texterId)
            this.onChange({
              texters: [
                ...this.formValues().texters,
                {
                  id: texterId,
                  firstName: newTexter.firstName,
                  assignment: {
                    contactsCount: 0,
                    needsMessageCount: 0
                  }
                }
              ]
            })
          }
        }}
      />
    )

    return (
      <div>
        {orgTexters.length > 0 ? autocomplete : ''}
      </div>
    )
  }

  showTexters() {
    return this.formValues().texters.map((texter, index) => {
      const messagedCount = texter.assignment.contactsCount - texter.assignment.needsMessageCount
      return (
        <div className={css(styles.texterRow)}>
          <div className={css(styles.leftSlider)}>
            <Slider
              maxValue={this.formValues().contactsCount}
              value={messagedCount}
              color={theme.colors.darkGray}
              direction={1}
            />
          </div>
          <div className={css(styles.assignedCount)}>
            {messagedCount}
          </div>
          <div className={css(styles.nameColumn)}>
            {`${texter.firstName}`}
          </div>
          <div className={css(styles.input)}>
            <Form.Field
              name={`texters[${index}].assignment.needsMessageCount`}
              hintText='Contacts'
              fullWidth
              onFocus={() => this.setState({ focusedTexter: texter.id })}
              onBlur={() => this.setState({
                focusedTexter: null
              })}
            />
          </div>
          <div className={css(styles.slider)}>
            <Slider
              maxValue={this.formValues().contactsCount}
              value={texter.assignment.needsMessageCount}
              color={theme.colors.green}
              direction={0}
            />
          </div>
          <div className={css(styles.removeButton)}>
            <IconButton
              onTouchTap={async () => {
                const currentFormValues = this.formValues()
                const newFormValues = {
                  ...currentFormValues
                }
                newFormValues.texters = newFormValues.texters.slice()
                if (messagedCount === 0) {
                  newFormValues.texters.splice(index, 1)
                } else {
                  await this.setState({ focusedTexter: texter.id })
                  newFormValues.texters[index] = {
                    ...texter,
                    assignment: {
                      needsMessageCount: 0
                    }
                  }
                }
                this.onChange(newFormValues)
              }}
            >
              <DeleteIcon />
            </IconButton>
          </div>
        </div>
      )
    })
  }

  render() {
    const { organizationUuid } = this.props
    let subtitle = ''
    subtitle = (
      <div>
        <OrganizationJoinLink organizationUuid={organizationUuid} />
      </div>
    )

    const assignedContacts = this.formValues()
      .texters
      .reduce(((prev, texter) => prev + texter.assignment.contactsCount), 0)

    const headerColor = assignedContacts === this.formValues().contactsCount ? theme.colors.green : theme.colors.orange
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
            <div className={css(styles.headerContainer)}>
              <div
                style={{
                  ...inlineStyles.header,
                  color: headerColor,
                  flex: '1 1 50%'
                }}
              >
                {`Assigned contacts: ${assignedContacts}/${this.formValues().contactsCount}`}
              </div>
              <div
                className={css(styles.splitToggle)}
              >
                <Toggle
                  label='Auto-split assignments'
                  style={{
                    width: 'auto',
                    marginLeft: 'auto'
                  }}
                  toggled={this.state.autoSplit}
                  onToggle={() => {
                    this.setState({ autoSplit: !this.state.autoSplit }, () => {
                      if (this.state.autoSplit) {
                        const contactsCount = Math.floor(this.formValues().contactsCount / this.formValues().texters.length)
                        const newTexters = this.formValues().texters.map((texter) =>
                          ({
                            ...texter,
                            assignment: {
                              ...texter.assignment,
                              contactsCount
                            }
                          })
                        )
                        this.onChange({ ...this.formValues(), texters: newTexters })
                      }
                    })
                  }}
                />
              </div>
            </div>
            <div className={css(styles.texterRow)}>
              <div className={css(styles.leftSlider, styles.alreadyTextedHeader)}>
                Already texted
              </div>
              <div className={css(styles.assignedCount)}>
              </div>
              <div className={css(styles.nameColumn)}>
              </div>
              <div className={css(styles.input)}>
              </div>
              <div className={css(styles.slider, styles.availableHeader)}>
                Available to assign
              </div>
              <div className={css(styles.removeButton)}>
              </div>
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
