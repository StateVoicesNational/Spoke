import React from 'react'
import loadData from './hoc/load-data'
import gql from 'graphql-tag'
import wrapMutations from './hoc/wrap-mutations'
import { withRouter } from 'react-router'
import { StyleSheet, css } from 'aphrodite'
import theme from '../styles/theme'

const styles = StyleSheet.create({
  greenBox: {
    ...theme.layouts.greenBox
  }
})

class JoinTeam extends React.Component {
  state = {
    errors: null
  }
  async componentWillMount() {
    let organization = null
    try {
      organization = await this.props.mutations.joinOrganization()
    } catch (ex) {
      this.setState({ errors: 'Something went wrong trying to join this organization. Email the link to us at help@gearshift.co' })
    }
    if (organization) {
      this.props.router.push(`/app/${organization.data.joinOrganization.id}`)
    }
  }

  renderErrors() {
    if (this.state.errors) {
      return (
        <div className={css(styles.greenBox)}>
          {this.state.errors}
        </div>
      )
    }
    return (<div />)
  }

  render() {
    return (
      <div>
        {this.renderErrors()}
      </div>
    )
  }
}

JoinTeam.propTypes = {
  mutations: React.PropTypes.object,
  router: React.PropTypes.object
}

const mapMutationsToProps = ({ ownProps }) => ({
  joinOrganization: () => ({
    mutation: gql`
      mutation joinOrganization($organizationUuid: String!) {
        joinOrganization(organizationUuid: $organizationUuid) {
          id
        }
      }`,
    variables: { organizationUuid: ownProps.params.organizationUuid }
  })
})

export default loadData(wrapMutations(withRouter(JoinTeam)), { mapMutationsToProps })
