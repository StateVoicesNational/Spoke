import React from 'react'
import loadData from './hoc/load-data'
import gql from 'graphql-tag'
import wrapMutations from './hoc/wrap-mutations'
import { ReactScriptLoaderMixin } from 'react-script-loader'
import GSForm from '../components/forms/GSForm'
import Form from 'react-formal'
import Dialog from 'material-ui/Dialog'
import GSSubmitButton from '../components/forms/GSSubmitButton'
import FlatButton from 'material-ui/FlatButton'
import RaisedButton from 'material-ui/RaisedButton'
import yup from 'yup'
import { formatMoney } from '../lib'
import {Card, CardActions, CardHeader, CardText} from 'material-ui/Card';

const Billing = React.createClass({
  mixins: [ ReactScriptLoaderMixin ],

  getInitialState: function() {
    return {
      addCreditDialogOpen: false,
      creditCardDialogOpen: false
    };
  },

  getScriptURL: function() {
    return 'https://js.stripe.com/v2/'
  },

  onScriptLoaded: function() {
    const { stripePublishableKey } = this.props.data
    Stripe.setPublishableKey(stripePublishableKey);
  },

  onScriptError: () =>  this.setState({ stripeLoading: false, stripeLoadingError: true }),

  handleStripeResponse: async function(status, response) {
    if (response.error) {
      console.log(error)
    }
    else {
      await this.props.mutations.updateCard(response.id)
      this.handleCloseCreditCardDialog()
    }
  },
  handleSubmitCardForm: function(formValues) {
    console.log("ONSUBMIT", formValues)
    Stripe.card.createToken(formValues, this.handleStripeResponse)
  },

  handleSubmitAccountCreditForm: async function({ creditAmount }) {
    await this.props.mutations.addAccountCredit(creditAmount)
    this.handleCloseAddCreditDialog()
  },
  handleOpenCreditCardDialog: function() {
    this.setState({ creditCardDialogOpen: true })
  },
  handleCloseCreditCardDialog: function() {
    this.setState({ creditCardDialogOpen: false })
  },
  handleOpenAddCreditDialog: function() {
    this.setState({ addCreditDialogOpen: true })
  },
  handleCloseAddCreditDialog: function() {
    console.log("here?")
    this.setState({ addCreditDialogOpen: false })
  },

  renderCardForm() {
    const cardFormSchema = yup.object({
      'number': yup.string().required(),
      'exp_year': yup.string().required(),
      'exp_month': yup.string().required(),
    })

    return (
      <GSForm
        schema={cardFormSchema}
        onSubmit={this.handleSubmitCardForm}
      >

        <Dialog
          open={this.state.creditCardDialogOpen}
          actions={[
            <FlatButton
              label='Cancel'
              onTouchTap={this.handleCloseCreditCardDialog}
            />,
            <Form.Button
              type='submit'
              label='Change card'
              component={GSSubmitButton}
            />
          ]}
          onRequestClose={this.handleCloseCreditCardDialog}
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
            hintText="01"
          />
          <Form.Field
            name='exp_year'
            label='Expiration year'
            hintText="2019"
          />
        </Dialog>
      </GSForm>
    )
  },

  renderCreditForm() {
    const {  organization } = this.props.data
    const {  creditCurrency } = organization.billingDetails

    const formSchema = yup.object({
      'creditAmount': yup.number().required()
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
      choices[amount] = `${formatMoney(amount, creditCurrency)} - approx ${amount/organization.pricePerContact} contacts`
    }

    return (
      <GSForm
        schema={formSchema}
        onSubmit={this.handleSubmitAccountCreditForm}
      >
        <Dialog
          open={this.state.addCreditDialogOpen}
          actions={[
            <FlatButton
              label='Cancel'
              onTouchTap={this.handleCloseAddCreditDialog}
            />,
            <Form.Button
              type='submit'
              component={GSSubmitButton}
              label='Add credit'
            />
          ]}
          onRequestClose={this.handleCloseAddCreditDialog}
        >
          <Form.Field
            name='creditAmount'
            value={50000}
            type='select'
            fullWidth
            choices={choices}
          />
        </Dialog>
      </GSForm>
    )
  },
  renderCreditCard(card) {
    return card ? (
      <div>
        {card.brand} - {card.last4} exp {card.expMonth}/{card.expYear}
      </div>
    ) : 'No card'
  },
  render: function() {
    const {  organization } = this.props.data
    const { creditAmount, creditCurrency, creditCard } = organization.billingDetails
    return (
      <div>
        <Card>
          <CardHeader
            title="Account credit"
            subtitle={ formatMoney(creditAmount, creditCurrency) }
          />
          <CardActions>
            <FlatButton
              label='Add credit'
              primary
              onTouchTap={this.handleOpenAddCreditDialog}
            />
          </CardActions>
        </Card>
        <Card>
          <CardHeader
            title="Credit card"
            subtitle={ this.renderCreditCard(creditCard) }
          />
          <CardActions>
            <FlatButton
              label='Change card'
              primary
              onTouchTap={this.handleOpenCreditCardDialog}
            />
          </CardActions>
        </Card>
        <div>
          { this.renderCreditForm()}
          { this.renderCardForm() }
        </div>
      </div>
    )
  }

})

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
        pricePerContact
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
      stripePublishableKey
    }`,
    variables: {
      organizationId: ownProps.params.organizationId
    },
    forceFetch: true
  }
})
export default loadData(wrapMutations(Billing), { mapQueriesToProps, mapMutationsToProps })
