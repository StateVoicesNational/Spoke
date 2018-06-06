import PropTypes from 'prop-types'
import React from 'react'
import Form from 'react-formal'
import gql from 'graphql-tag'
import yup from 'yup'
import moment from 'moment'
import { StyleSheet, css } from 'aphrodite'

import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';

import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
// TODO: material-ui
import Toggle from 'material-ui/Toggle';

import loadData from './hoc/load-data';
import wrapMutations from './hoc/wrap-mutations';
import GSForm from '../components/forms/GSForm';
import GSSubmitButton from '../components/forms/GSSubmitButton';

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
          <DialogContent>
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
          </DialogContent>
          <DialogActions>
            {/* <div className={css(styles.dialogActions)}> */}
              <Button
                style={inlineStyles.dialogButton}
                onClick={this.handleCloseTextingHoursDialog}
              >
                Cancel
              </Button>
              <Form.Button
                type='submit'
                style={inlineStyles.dialogButton}
                component={GSSubmitButton}
                label='Save'
              />
            {/* </div> */}
          </DialogActions>
        </GSForm>
      </Dialog>
    );
  }

  render() {
    const { organization } = this.props.data
    return (
      <div>
        <Card>
          <CardHeader title='Settings' />
          <CardContent>
            <div className={css(styles.section)}>
              <span className={css(styles.sectionLabel)}>
              </span>
              <Toggle
                toggled={organization.textingHoursEnforced}
                label='Enforce texting hours?'
                onToggle={async (event, isToggled) => await this.props.mutations.updateTextingHoursEnforcement(isToggled)}
              />
            </div>

            {organization.textingHoursEnforced &&
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
            }
          </CardContent>
          <CardActions>
            {organization.textingHoursEnforced &&
              <Button
                primary
                onClick={this.handleOpenTextingHoursDialog}
              >
                Change texting hours
              </Button>
            }
          </CardActions>
        </Card>
        <div>
          {this.renderTextingHoursForm()}
        </div>
      </div>
    );
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
  })
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
