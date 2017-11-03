import React from 'react'
import loadData from './hoc/load-data'
import gql from 'graphql-tag'
import Form from 'react-formal'
import yup from 'yup'
import { StyleSheet, css } from 'aphrodite'
import wrapMutations from './hoc/wrap-mutations'
import theme from '../styles/theme'
import Paper from 'material-ui/Paper'
import { withRouter } from 'react-router'
import GSForm from '../components/forms/GSForm'

const styles = StyleSheet.create({
  container: {
    marginTop: '5vh',
    textAlign: 'center',
    color: theme.colors.white
  },
  formContainer: {
    ...theme.layouts.greenBox
  },
  bigHeader: {
    ...theme.text.header,
    fontSize: 40
  },
  header: {
    ...theme.text.header,
    marginRight: 'auto',
    marginLeft: 'auto',
    maxWidth: '80%'
  },
  form: {
    marginTop: 40,
    maxWidth: '80%',
    marginRight: 'auto',
    marginLeft: 'auto'
  }
})

export default class TexterProfile extends React.Component {

  render() {
    return (
      <div>
        <h1> Texter Profile </h1>
      </div>
    )
  }
}

// const mapQueriesToProps = ({ ownProps }) => ({
//   inviteData: {
//     query: gql`query getInvite($inviteId: String!) {
//       inviteByHash(hash: $inviteId) {
//         id
//         isValid
//       }
//     }`,
//     variables: {
//       inviteId: ownProps.params.inviteId
//     },
//     forceFetch: true
//   },
//   userData: {
//     query: gql` query getCurrentUser {
//       currentUser {
//         id
//       }
//     }`,
//     forceFetch: true
//   }
// })

TexterProfile.propTypes = {
  mutations: React.PropTypes.object,
  router: React.PropTypes.object,
  userData: React.PropTypes.object,
  inviteData: React.PropTypes.object
}
//
// const mapMutationsToProps = () => ({
//   createOrganization: (name, userId, inviteId) => ({
//     mutation: gql`
//       mutation createOrganization($name: String!, $userId: String!, $inviteId: String!) {
//         createOrganization(name: $name, userId: $userId, inviteId: $inviteId) {
//           id
//         }
//       }`,
//     variables: { name, userId, inviteId }
//   })
// })
//
// export default loadData(wrapMutations(withRouter(CreateOrganization)), { mapQueriesToProps, mapMutationsToProps })
