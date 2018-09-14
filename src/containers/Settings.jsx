import PropTypes from 'prop-types'
import React from 'react'
import loadData from './hoc/load-data'
import gql from 'graphql-tag'
import wrapMutations from './hoc/wrap-mutations'
import GSForm from '../components/forms/GSForm'
import Form from 'react-formal'
import Dialog from 'material-ui/Dialog'
import GSSubmitButton from '../components/forms/GSSubmitButton'
import FlatButton from 'material-ui/FlatButton'
import yup from 'yup'
import { Card, CardText, CardActions, CardHeader } from 'material-ui/Card'
import { StyleSheet, css } from 'aphrodite'
import Toggle from 'material-ui/Toggle'
import moment from 'moment'
const styles = StyleSheet.create({
  section: {
    margin: '10px 0'
  },
  sectionLabel: {
    opacity: 0.8,
    marginRight: 5
  },
  textingHoursSpan: {
    fontWeight: 'bold'
  },
  dialogActions: {
    marginTop: 20,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end'
  }
})

const inlineStyles = {
  dialogButton: {
    display: 'inline-block'
  }
}

const formatTextingHours = (hour) => moment(hour, 'H').format('h a')
class Settings extends React.Component {

  state = {
    formIsSubmitting: false
  }

  handleSubmitTextingHoursForm = async ({ textingHoursStart, textingHoursEnd }) => {
    await this.props.mutations.updateTextingHours(textingHoursStart, textingHoursEnd)
    this.handleCloseTextingHoursDialog()
  }

  handleOpenTextingHoursDialog = () => this.setState({ textingHoursDialogOpen: true })

  handleCloseTextingHoursDialog = () => this.setState({ textingHoursDialogOpen: false })

  renderTextingHoursForm() {
    const { organization } = this.props.data
    const { textingHoursStart, textingHoursEnd } = organization
    const formSchema = yup.object({
      textingHoursStart: yup.number().required(),
      textingHoursEnd: yup.number().required()
    })

    const hours = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]
    const hourChoices = hours.map((hour) => ({
      value: hour,
      label: formatTextingHours(hour)
    }))

    return (
      <Dialog
        open={this.state.textingHoursDialogOpen}
        onRequestClose={this.handleCloseTextingHoursDialog}
      >
        <GSForm
          schema={formSchema}
          onSubmit={this.handleSubmitTextingHoursForm}
          defaultValue={{ textingHoursStart, textingHoursEnd }}
        >
          <Form.Field
            label='Start time'
            name='textingHoursStart'
            type='select'
            fullWidth
            choices={hourChoices}
          />
          <Form.Field
            label='End time'
            name='textingHoursEnd'
            type='select'
            fullWidth
            choices={hourChoices}
          />
          <div className={css(styles.dialogActions)}>
            <FlatButton
              label='Cancel'
              style={inlineStyles.dialogButton}
              onTouchTap={this.handleCloseTextingHoursDialog}
            />
            <Form.Button
              type='submit'
              style={inlineStyles.dialogButton}
              component={GSSubmitButton}
              label='Save'
            />
          </div>
        </GSForm>
      </Dialog>
    )
  }

  render() {
    const { organization } = this.props.data
    const { optOutMessage } = organization
    const formSchema = yup.object({
      optOutMessage: yup.string().required()
    })

    return (
      <div>
        <Card>
          <CardHeader
            title='Settings'
          />
          <CardText>
            <div className={css(styles.section)}>
            <div className={css(styles.section)}>
              <Toggle
                toggled={organization.textingTurnedOff}
                label='Turn Texting Off For All Campaigns?'
                onToggle={async (event, isToggled) => await this.props.mutations.textingTurnedOff(isToggled)}
              />
            </div>

            <GSForm
              schema={formSchema}
              onSubmit={this.props.mutations.updateOptOutMessage}
              defaultValue={{ optOutMessage }}
            >

              <Form.Field
                label='Default Opt-Out Message'
                name='optOutMessage'
                fullWidth
              />

              <Form.Button
                type='submit'
                label={this.props.saveLabel || 'Save Opt-Out Message'}
              />

            </GSForm>
            </div>
          </CardText>

          <CardText>
            <div className={css(styles.section)}>
              <span className={css(styles.sectionLabel)}>
              </span>
              <Toggle
                toggled={organization.textingHoursEnforced}
                label='Enforce texting hours?'
                onToggle={async (event, isToggled) => await this.props.mutations.updateTextingHoursEnforcement(isToggled)}
              />
            </div>

            {organization.textingHoursEnforced ? (
              <div className={css(styles.section)}>
                <span className={css(styles.sectionLabel)}>
                  Texting hours:
                </span>
                <span className={css(styles.textingHoursSpan)}>
                  {formatTextingHours(organization.textingHoursStart)} to {formatTextingHours(organization.textingHoursEnd)}</span>
                  {window.TZ ? (
                    ` in your organisations local time. Timezone ${window.TZ}`
                  ) : ' in contacts local time (or 12pm-6pm EST if timezone is unknown)'}
              </div>
            ) : ''}
          </CardText>
          <CardActions>
            {organization.textingHoursEnforced ? (
              <FlatButton
                label='Change texting hours'
                primary
                onTouchTap={this.handleOpenTextingHoursDialog}
              />
            ) : ''}
          </CardActions>
        </Card>
        <div>
          {this.renderTextingHoursForm()}
        </div>
      </div>
    )
  }
}

Settings.propTypes = {
  data: PropTypes.object,
  params: PropTypes.object,
  mutations: PropTypes.object
}

const mapMutationsToProps = ({ ownProps }) => ({
  updateTextingHours: (textingHoursStart, textingHoursEnd) => ({
    mutation: gql`
      mutation updateTextingHours($textingHoursStart: Int!, $textingHoursEnd: Int!, $organizationId: String!) {
        updateTextingHours(textingHoursStart: $textingHoursStart, textingHoursEnd: $textingHoursEnd, organizationId: $organizationId) {
          id
          textingHoursEnforced
          textingHoursStart
          textingHoursEnd
        }
      }`,
    variables: {
      organizationId: ownProps.params.organizationId,
      textingHoursStart,
      textingHoursEnd
    }
  }),
  updateTextingHoursEnforcement: (textingHoursEnforced) => ({
    mutation: gql`
      mutation updateTextingHoursEnforcement($textingHoursEnforced: Boolean!, $organizationId: String!) {
        updateTextingHoursEnforcement(textingHoursEnforced: $textingHoursEnforced, organizationId: $organizationId) {
          id
          textingHoursEnforced
          textingHoursStart
          textingHoursEnd
        }
      }`,
    variables: {
      organizationId: ownProps.params.organizationId,
      textingHoursEnforced
    }
  }),
  updateOptOutMessage: ({optOutMessage}) => ({
    mutation: gql`
      mutation updateOptOutMessage($optOutMessage: String!, $organizationId: String!) {
        updateOptOutMessage(optOutMessage: $optOutMessage, organizationId: $organizationId) {
          id
          optOutMessage
        }
      }`,
    variables: {
      organizationId: ownProps.params.organizationId,
      optOutMessage
    }
  }),
  textingTurnedOff: (textingTurnedOff) => ({
    mutation: gql`
      mutation textingTurnedOff($textingTurnedOff: Boolean!, $organizationId: String!) {
        textingTurnedOff(textingTurnedOff: $textingTurnedOff, organizationId: $organizationId) {
          id
          textingTurnedOff
        }
      }`,
    variables: {
      organizationId: ownProps.params.organizationId,
      textingTurnedOff
    }
  }),

})

const mapQueriesToProps = ({ ownProps }) => ({
  data: {
    query: gql`query adminGetCampaigns($organizationId: String!) {
      organization(id: $organizationId) {
        id
        name
        textingHoursEnforced
        textingHoursStart
        textingHoursEnd
        optOutMessage
      }
    }`,
    variables: {
      organizationId: ownProps.params.organizationId
    },
    forceFetch: true
  }
})

export default loadData(
    wrapMutations(Settings),
    { mapQueriesToProps, mapMutationsToProps })
