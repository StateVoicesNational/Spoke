import React from 'react'
import { StyleSheet, css } from 'aphrodite'
import gql from 'graphql-tag'
import { withRouter } from 'react-router'
import loadData from './hoc/load-data'
import { Card, CardActions, CardHeader, CardText } from 'material-ui/Card'
import Dialog from 'material-ui/Dialog'
import FlatButton from 'material-ui/FlatButton'
import GSSubmitButton from '../components/forms/GSSubmitButton'
import GSForm from '../components/forms/GSForm'
import Form from 'react-formal'
import { formatMoney } from '../lib'

import yup from 'yup'

const styles = StyleSheet.create({
  container: {
    padding: 20
  }
})

class SuperAdminDashboard extends React.Component {
  state = {
    addCreditDialogOpen: false,
    organizationId: null
  }

  handleOpenAddCreditDialog = (organizationId) => this.setState({ addCreditDialogOpen: true, organizationId })

  handleCloseAddCreditDialog = () => this.setState({ addCreditDialogOpen: false, organizationId: null})

  handleSubmitAccountCreditForm = async ({ balanceAmount, paymentMethod }) => {
    await this.props.mutations.addManualAccountCredit(parseInt(balanceAmount * 100, 10), this.state.organizationId, paymentMethod)
    this.handleCloseAddCreditDialog()
  }

  renderAddCreditDialog() {
    const formSchema = yup.object({
      balanceAmount: yup.number().positive().required(),
      paymentMethod: yup.string().required()
    })

    const paymentSelectChoices = {
      WIRE: 'Wire'
    }

    return (
      <Dialog
        open={this.state.addCreditDialogOpen}
        onRequestClose={this.handleCloseAddCreditDialog}
      >
        <GSForm
          schema={formSchema}
          onSubmit={this.handleSubmitAccountCreditForm}
          defaultValue={{
            paymentMethod: 'WIRE'
          }}
        >
          <Form.Field
            label='Credit amount (in dollars)'
            name='balanceAmount'
            autoFocus
            fullWidth
          />
          <Form.Field
            label='Payment method'
            name='paymentMethod'
            type='select'
            fullWidth
            choices={paymentSelectChoices}
          />
          <div className={css(styles.dialogActions)}>
            <FlatButton
              label='Cancel'
              onTouchTap={this.handleCloseAddCreditDialog}
            />,
            <Form.Button
              type='submit'
              component={GSSubmitButton}
              label='Add credit'
            />
          </div>
        </GSForm>
      </Dialog>
    )
  }
  render() {
    return (
      <div className={css(styles.container)}>
        { this.props.data.organizations.map((organization) => (
          <Card
            key={organization.id}
          >
            <CardHeader
              title={organization.name}
              subtitle={formatMoney(organization.billingDetails.balanceAmount, organization.billingDetails.creditCurrency)}
              actAsExpander
              showExpandableButton
            />
            <CardActions>
              <FlatButton
                label="Add credit"
                onTouchTap={() => this.handleOpenAddCreditDialog(organization.id)}
              />
              <FlatButton
                label="Go to balance history"
                onTouchTap={() => this.handleOpenAddCreditDialog(organization.id)}
              />
            </CardActions>
          </Card>
          ))
        }
        {this.renderAddCreditDialog()}
      </div>
    )
  }
}

SuperAdminDashboard.propTypes = {
  data: React.PropTypes.object,
  router: React.PropTypes.object,
  path: React.PropTypes.string
}

const mapMutationsToProps = ({ ownProps }) => ({
  addManualAccountCredit: (balanceAmount, organizationId, paymentMethod) => ({
    mutation: gql`
      mutation addManualAccountCredit($balanceAmount: Int!, $organizationId: String!, $paymentMethod: String!) {
        addManualAccountCredit(balanceAmount: $balanceAmount, organizationId: $organizationId, paymentMethod: $paymentMethod) {
          id
          billingDetails {
            balanceAmount
          }
        }
      }`,
    variables: {
      organizationId,
      balanceAmount,
      paymentMethod
    }
  })
})

const mapQueriesToProps = () => ({
  data: {
    query: gql`query getAllOrganizations {
      organizations {
        id
        name
        billingDetails {
          creditCurrency
          balanceAmount
          balanceCredits {
            amount
            currency
          }
        }
      }
    }`,
    forceFetch: true
  }
})

export default loadData(withRouter(SuperAdminDashboard), { mapQueriesToProps, mapMutationsToProps })
