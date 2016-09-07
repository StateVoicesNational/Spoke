import React from 'react'
import { StyleSheet, css } from 'aphrodite'
import gql from 'graphql-tag'
import { withRouter } from 'react-router'
import loadData from './hoc/load-data'
import { Card, CardActions, CardHeader, CardText } from 'material-ui/Card'
import Dialog from 'material-ui/Dialog'
import FlatButton from 'material-ui/FlatButton'
import GSSubmitButton from '../components/forms/GSSubmitButton'
import {Table, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn} from 'material-ui/Table';
import GSForm from '../components/forms/GSForm'
import Form from 'react-formal'
import { formatMoney } from '../lib'
import moment from 'moment'

class SuperAdminOrganizationPage extends React.Component {
  render() {
    const { organization } = this.props.data
    const { balanceCredits } = organization.billingDetails
    return (
      <div>
        {organization.name}
        <Table>
          <TableHeader
            adjustForCheckbox={false}
            displaySelectAll={false}
          >
            <TableRow>
              <TableHeaderColumn>Date</TableHeaderColumn>
              <TableHeaderColumn>Amount</TableHeaderColumn>
              <TableHeaderColumn>Source</TableHeaderColumn>
              <TableHeaderColumn>Payment method</TableHeaderColumn>
            </TableRow>
          </TableHeader>
          <TableBody
            displayRowCheckbox={false}
          >
            { balanceCredits.map((balanceLineItem) => (
                <TableRow>
                  <TableRowColumn>{moment(balanceLineItem.createdAt).format('YYYY-MM-DD')}</TableRowColumn>
                  <TableRowColumn>{formatMoney(balanceLineItem.amount, balanceLineItem.currency)}</TableRowColumn>
                  <TableRowColumn>{balanceLineItem.source}</TableRowColumn>
                  <TableRowColumn>{ balanceLineItem.payment.method }</TableRowColumn>
                </TableRow>
              ))
            }
          </TableBody>
        </Table>
      </div>
    )
  }
}

SuperAdminOrganizationPage.propTypes = {
  data: React.PropTypes.object,
  router: React.PropTypes.object,
  path: React.PropTypes.string
}

const mapQueriesToProps = ({ ownProps }) => ({
  data: {
    query: gql`query superAdminGetOrganization($organizationId: String!) {
      organization(id: $organizationId) {
        id
        name
        billingDetails {
          creditCurrency
          balanceAmount
          balanceCredits {
            amount
            currency
            source
            createdAt
            payment {
              method
              externalId
            }
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

export default loadData(withRouter(SuperAdminOrganizationPage), { mapQueriesToProps })
