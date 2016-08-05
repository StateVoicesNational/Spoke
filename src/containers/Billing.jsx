import React from 'react'
import loadData from './hoc/load-data'
import loadStripe from './hoc/load-stripe'
import gql from 'graphql-tag'
import wrapMutations from './hoc/wrap-mutations'
import GSForm from '../components/forms/GSForm'
import Form from 'react-formal'
import Dialog from 'material-ui/Dialog'
import GSSubmitButton from '../components/forms/GSSubmitButton'
import FlatButton from 'material-ui/FlatButton'
import yup from 'yup'
import { formatMoney } from '../lib'
import { Card, CardText, CardActions, CardHeader } from 'material-ui/Card'
import { GraphQLRequestError } from '../network/errors'
import { StyleSheet, css } from 'aphrodite'

const styles = StyleSheet.create({
  section: {
    margin: '10px 0'
  },
  sectionLabel: {
    opacity: 0.8,
    marginRight: 5
  }
})

const inlineStyles = {
  dialogButton: {
    display: 'inline-block'
  }
}

class Billing extends React.Component {

  state = {
    addCreditDialogOpen: false,
    creditCardDialogOpen: false
  }

  createStripeToken = async (formValues) => (
    new Promise((resolve, reject) => (
      Stripe.card.createToken(formValues, (status, response) => {
        if (response.error) {
          reject(new GraphQLRequestError({
            status: 400,
            message: response.error.message
          }))
        } else {
          resolve(response.id)
        }
      })
    ))
  )

  handleSubmitCardForm = async (formValues) => {
    const token = await this.createStripeToken(formValues)
    await this.props.mutations.updateCard(token)
    this.handleCloseCreditCardDialog()
  }

  handleSubmitAccountCreditForm = async ({ creditAmount }) => {
    await this.props.mutations.addAccountCredit(creditAmount)
    this.handleCloseAddCreditDialog()
  }

  handleOpenCreditCardDialog = () => this.setState({ creditCardDialogOpen: true })

  handleCloseCreditCardDialog = () => this.setState({ creditCardDialogOpen: false })

  handleOpenAddCreditDialog = () => this.setState({ addCreditDialogOpen: true })

  handleCloseAddCreditDialog = () => this.setState({ addCreditDialogOpen: false })

  renderCardForm() {
    const cardFormSchema = yup.object({
      number: yup.string().required(),
      exp_year: yup.number().required(),
      exp_month: yup.number().required()
    })

    return (
      <Form.Context>
        <Dialog
          open={this.state.creditCardDialogOpen}
          actions={[
            <FlatButton
              label='Cancel'
              style={inlineStyles.dialogButton}
              onTouchTap={this.handleCloseCreditCardDialog}
            />,
            <Form.Button
              type='submit'
              label='Change card'
              style={inlineStyles.dialogButton}
              component={GSSubmitButton}
            />
          ]}
          onRequestClose={this.handleCloseCreditCardDialog}
        >
          <GSForm
            schema={cardFormSchema}
            onSubmit={this.handleSubmitCardForm}
          >
            <Form.Field
              name='number'
              data-stripe
              label='Card number'
              fullWidth
              autoFocus
            />
            <Form.Field
              name='exp_month'
              label='Expiration month'
              hintText='01'
            />
            <Form.Field
              name='exp_year'
              label='Expiration year'
              hintText='2019'
            />
          </GSForm>
        </Dialog>
      </Form.Context>
    )
  }

  renderCreditForm() {
    const { organization } = this.props.data
    const { creditCurrency } = organization.billingDetails

    const formSchema = yup.object({
      creditAmount: yup.number().required()
    })

    const amounts = [
      10000,
      50000,
      100000
    ]

    let choices = {}
    const count = amounts.length
    for (let i = 0; i < count; i++) {
      const amount = amounts[i]
      const formattedAmount = formatMoney(amount, creditCurrency)
      const pricePerContact = 10 // FIXME
      const contactCount = amount / pricePerContact
      choices[amount] = `${formattedAmount} - approx ${contactCount} contacts`
    }

    return (
      <Form.Context>
        <Dialog
          open={this.state.addCreditDialogOpen}
          actions={[
            <FlatButton
              label='Cancel'
              style={inlineStyles.dialogButton}
              onTouchTap={this.handleCloseAddCreditDialog}
            />,
            <Form.Button
              type='submit'
              style={inlineStyles.dialogButton}
              component={GSSubmitButton}
              label='Add credit'
            />
          ]}
          onRequestClose={this.handleCloseAddCreditDialog}
        >
          <GSForm
            schema={formSchema}
            onSubmit={this.handleSubmitAccountCreditForm}
          >
            <Form.Field
              label='Credit amount'
              name='creditAmount'
              type='select'
              fullWidth
              choices={choices}
              value={50000}
            />
          </GSForm>

        </Dialog>
      </Form.Context>
    )
  }

  render() {
    const { organization } = this.props.data
    const { creditAmount, creditCurrency, creditCard } = organization.billingDetails
    return (
      <div>
        <Card>
          <CardHeader
            title='Account credit'
          />
          <CardText>
            <div className={css(styles.section)}>
              <span className={css(styles.sectionLabel)}>
                Balance:
              </span>
              {formatMoney(creditAmount, creditCurrency)}
            </div>
            <div className={css(styles.section)}>
              <span className={css(styles.sectionLabel)}>
                Card:
              </span>
              {creditCard ? `${creditCard.brand} ****${creditCard.last4}` : 'No card'}
            </div>
          </CardText>
          <CardActions>
            {creditCard ?
              <FlatButton
                label='Buy account credit'
                primary
                onTouchTap={this.handleOpenAddCreditDialog}
              /> : ''
            }
            <FlatButton
              label={creditCard ? 'Change card' : 'Add credit card'}
              primary
              onTouchTap={this.handleOpenCreditCardDialog}
            />
          </CardActions>
        </Card>
        <div>
          {this.renderCreditForm()}
          {this.renderCardForm()}
        </div>
      </div>
    )
  }
}

Billing.propTypes = {
  data: React.PropTypes.object,
  params: React.PropTypes.object,
  mutations: React.PropTypes.object
}

const mapMutationsToProps = ({ ownProps }) => ({
  addAccountCredit: (creditAmount) => ({
    mutation: gql`
      mutation addAccountCredit($creditAmount: Int!, $organizationId: String!) {
        addAccountCredit(creditAmount: $creditAmount, organizationId: $organizationId) {
          id
          billingDetails {
            creditAmount
          }
        }
      }`,
    variables: {
      organizationId: ownProps.params.organizationId,
      creditAmount
    }
  }),
  updateCard: (stripeToken) => ({
    mutation: gql`
      mutation updateCard($stripeToken: String!, $organizationId: String!) {
        updateCard(stripeToken: $stripeToken, organizationId: $organizationId) {
          id
          billingDetails {
            creditCard {
              last4
              brand
              expMonth
              expYear
            }
          }
        }
      }`,
    variables: {
      organizationId: ownProps.params.organizationId,
      stripeToken
    }
  })
})

const mapQueriesToProps = ({ ownProps }) => ({
  data: {
    query: gql`query adminGetCampaigns($organizationId: String!) {
      organization(id: $organizationId) {
        id
        name
        billingDetails {
          creditAmount
          creditCurrency
          creditCard {
            expMonth
            expYear
            last4
            brand
          }
        }
      }
    }`,
    variables: {
      organizationId: ownProps.params.organizationId
    },
    forceFetch: true
  }
})

export default loadStripe(
  loadData(
    wrapMutations(Billing),
    { mapQueriesToProps, mapMutationsToProps }))
