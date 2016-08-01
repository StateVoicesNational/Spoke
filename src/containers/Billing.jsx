import React from 'react'
import loadData from './hoc/load-data'
import gql from 'graphql-tag'
import wrapMutations from './hoc/wrap-mutations'
import { ReactScriptLoaderMixin } from 'react-script-loader'
import GSForm from '../components/forms/GSForm'
import Form from 'react-formal'
import yup from 'yup'

const Billing = React.createClass({
  mixins: [ ReactScriptLoaderMixin ],

  getInitialState: function() {
    return {
      stripeLoading: true,
      stripeLoadingError: false
    };
  },

  getScriptURL: function() {
    return 'https://js.stripe.com/v2/'
  },

  onScriptLoaded: function() {
    const { stripePublishableKey } = this.props.data
    Stripe.setPublishableKey(stripePublishableKey);
    this.setState({ stripeLoading: false, stripeLoadingError: false })
  },

  onScriptError: () =>  this.setState({ stripeLoading: false, stripeLoadingError: true }),

  handleStripeResponse: async function(status, response) {
    if (response.error) {
      console.log(error)
    }
    else {
      console.log("response.", response)
      await this.props.mutations.updateCard(response.id)
    }
  },

  handleSubmitCardForm: function(formValues) {
    console.log("ONSUBMIT", formValues)
    Stripe.card.createToken(formValues, this.handleStripeResponse)
  },

  handleSubmitAccountCreditForm: async function({ creditAmount }) {
    console.log(creditAmount, "credit amount submission")
    await this.props.mutations.addAccountCredit(creditAmount * 100)
  },

  renderCardForm() {
    const cardFormSchema = yup.object({
      'number': yup.string().required(),
      'exp_year': yup.string().required(),
      'exp_month': yup.string().required(),
    })

    return (
      <div>
        <GSForm
          schema={cardFormSchema}
          onSubmit={this.handleSubmitCardForm}
        >
          <Form.Field
            name='number'
            data-stripe
            label='Card number'
            fullWidth
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
          <Form.Button
            type='submit'
            label='Change card'
            name='submit'
            fullWidth
            secondary
            style={{ marginTop: 40 }}
          />
        </GSForm>
      </div>
    )
  },

  renderCreditForm() {
    const formSchema = yup.object({
      'creditAmount': yup.number().required()
    })

    return (
      <GSForm
        schema={formSchema}
        onSubmit={this.handleSubmitAccountCreditForm}
      >
        <Form.Field
          name='creditAmount'
          label='Credit to add'
        />
        <Form.Button
          type='submit'
          label='Add credit'
          name='submit'
          fullWidth
          secondary
          style={{ marginTop: 40 }}
        />
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
        <div>
          Credit: { creditAmount }
          { this.renderCreditForm() }
        </div>
        <div>
          { this.renderCreditCard(creditCard) }
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
        addAccountCredit(creditAmount: $creditAmount, organizationId: $organizationId)
          creditAmount
      }`,
    variables: {
      organizationId: ownProps.params.organizationId,
      creditAmount
    }
  }),
  updateCard: (stripeToken) => ({
    mutation: gql`
      mutation updateCard($stripeToken: String!, $organizationId: String!) {
        updateCard(stripeToken: $stripeToken, organizationId: $organizationId)
          creditCard {
            last4
            brand
            expMonth
            expYear
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
      stripePublishableKey
    }`,
    variables: {
      organizationId: ownProps.params.organizationId
    },
    forceFetch: true
  }
})
export default loadData(wrapMutations(Billing), { mapQueriesToProps, mapMutationsToProps })
