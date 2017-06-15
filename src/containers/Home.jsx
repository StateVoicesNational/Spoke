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
  header: {
    ...theme.text.header,
    marginBottom: 15,
    color: theme.colors.white
  },
  link: {
    ...theme.text.link
  }
})

class Home extends React.Component {
  state = {
    orgLessUser: false
  }

  handleOrgInviteClick = async (e) => {
    e.preventDefault()
    const newInvite = await this.props.mutations.createInvite({
      id: 'cats',
      is_valid: true,
      created_at: Date.now()
    })
    if (newInvite.errors) {
      alert('There was an error creating your invite')
      throw new Error(newInvite.errors)
    } else {
      // alert(newInvite.data.createInvite.id)
      this.props.router.push(`/invite/${newInvite.data.createInvite.id}`)
    }

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
        Spoke is a new way to run campaigns using text messaging. We are currently in private beta.
        </div>
        <div>
          <a className={css(styles.link)} href='#' onClick={this.handleOrgInviteClick}>Generate an organization invite to get started</a>
        </div>
      </div>
    )
  }

  render() {
    return (
      <div className={css(styles.container)}>
        <div className={css(styles.bigHeader)}>
          Spoke
        </div>
        <div className={css(styles.content)}>
          {this.renderContent()}
        </div>
      </div>
    )
  }
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
  // createCampaign: (campaign) => ({
  //   mutation: gql`
  //     mutation createBlankCampaign($campaign: CampaignInput!) {
  //       createCampaign(campaign: $campaign) {
  //         id
  //       }
  //     }
  //   `,
  //   variables: { campaign }
  // }),
  createInvite: (invite) => ({
      mutation: gql`
        mutation createInvite($invite: InviteInput!) {
          createInvite(invite: $invite) {
            id
          }
        }`,
      variables: { invite }
    })
})

export default loadData(wrapMutations(withRouter(Home)), { mapQueriesToProps, mapMutationsToProps })
