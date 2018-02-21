import PropTypes from 'prop-types'
import React from 'react'
import loadData from './hoc/load-data'
import gql from 'graphql-tag'
import { StyleSheet, css } from 'aphrodite'
import wrapMutations from './hoc/wrap-mutations'
import theme from '../styles/theme'
import { withRouter } from 'react-router'

const styles = StyleSheet.create({
  container: {
    marginTop: '5vh',
    textAlign: 'center',
    color: theme.colors.lightGray
  },
  content: {
    ...theme.layouts.greenBox
  },
  bigHeader: {
    ...theme.text.header,
    fontSize: 40
  },
  logoDiv: {
    ...theme.components.logoDiv
  },
  logoImg: {
    ...theme.components.logoImg
  },
  header: {
    ...theme.text.header,
    marginBottom: 15,
    color: theme.colors.white
  },
  link_dark_bg: {
    ...theme.text.link_dark_bg
  }
})

class Home extends React.Component {
  state = {
    orgLessUser: false
  }

  componentWillMount() {
    const user = this.props.data.currentUser
    if (user) {
      if (user.adminOrganizations.length > 0) {
        this.props.router.push(`/admin/${user.adminOrganizations[0].id}`)
      } else if (user.texterOrganizations.length > 0) {
        this.props.router.push(`/app/${user.texterOrganizations[0].id}`)
      } else {
        this.setState({ orgLessUser: true })
      }
    }
  }

  // not sure if we need this anymore -- only for new organizations
  handleOrgInviteClick = async (e) => {
    if (!window.SUPPRESS_SELF_INVITE || window.SUPPRESS_SELF_INVITE === 'undefined') {
      e.preventDefault()
      const newInvite = await this.props.mutations.createInvite({
        is_valid: true
      })
      if (newInvite.errors) {
        alert('There was an error creating your invite')
        throw new Error(newInvite.errors)
      } else {
        // alert(newInvite.data.createInvite.id)
        this.props.router.push(`/login?nextUrl=/invite/${newInvite.data.createInvite.hash}`)
      }
    }
  }

  renderContent() {
    if (this.state.orgLessUser) {
      return (
        <div>
          <div className={css(styles.header)}>
            You currently aren't part of any organization!
          </div>
          <div>
            If you got sent a link by somebody to start texting, ask that person to send you the link to join their organization. Then, come back here and start texting!
          </div>
        </div>
      )
    }
    return (
      <div>
        <div className={css(styles.header)}>
        Spoke is a new way to run campaigns using text messaging.
        </div>
        <div>
          <a className={css(styles.link_dark_bg)} href='/login' onClick={this.handleOrgInviteClick}>Login and get started</a>
        </div>
      </div>
    )
  }

  render() {
    return (
      <div className={css(styles.container)}>
        <div className={css(styles.logoDiv)}>
          <img
            src='https://user-images.githubusercontent.com/16676323/36105008-8b4fef00-0fe1-11e8-893c-a58786d1970c.png'
            className={css(styles.logoImg)}
          />
        </div>
        <div className={css(styles.content)}>
          {this.renderContent()}
        </div>
      </div>
    )
  }
}

Home.propTypes = {
  mutations: PropTypes.object,
  router: PropTypes.object,
  data: PropTypes.object
}

const mapQueriesToProps = () => ({
  data: {
    query: gql` query getCurrentUser {
      currentUser {
        id
        adminOrganizations:organizations(role:"ADMIN") {
          id
        }
        texterOrganizations:organizations(role:"TEXTER") {
          id
        }
      }
    }`
  }
})

const mapMutationsToProps = () => ({
  createInvite: (invite) => ({
    mutation: gql`
        mutation createInvite($invite: InviteInput!) {
          createInvite(invite: $invite) {
            hash
          }
        }`,
    variables: { invite }
  })
})

export default loadData(wrapMutations(withRouter(Home)), { mapQueriesToProps, mapMutationsToProps })
