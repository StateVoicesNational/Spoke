import React from 'react'
import Paper from 'material-ui/Paper'
import { FlowRouter } from 'meteor/kadira:flow-router'
import { List, ListItem } from 'material-ui/List'
import AppBar from 'material-ui/AppBar'
import { Meteor } from 'meteor/meteor'
import { Organizations } from '../../api/organizations/organizations.js'
import { createContainer } from 'meteor/react-meteor-data'
// import { TexterSignup } from '../components/texter_signup'
import { AppPage } from '../layouts/app_page'
import { Roles } from 'meteor/alanning:roles'
import { Card, CardActions, CardHeader, CardMedia, CardTitle, CardText } from 'material-ui/Card'
import { TexterSignupForm } from '../components/texter_signup_form'
import RaisedButton from 'material-ui/RaisedButton'
import { addTexter } from '../../api/organizations/methods'

class Page extends React.Component {
  componentWillReceiveProps({ organization, user }) {
    if (organization && user) {
      console.log('texter roles', Roles.userIsInRole(user, 'texter', organization._id))
      if (Roles.userIsInRole(user, 'texter', organization._id)) {
        FlowRouter.go('todos', { organizationId: organization._id })
      }
    }
  }

  handleExistingUserJoin() {
    console.log('calling texter!?')
    const { organization } = this.props
    const organizationId = organization._id
    addTexter.call({ organizationId }, (err) => {
      if (err) {
        alert(err)
      } else {
        FlowRouter.go('todos', { organizationId })
        console.log('successfully joined!')
      }
    })
  }
  render() {
    const { organization, organizations, loading, user } = this.props
    if (loading)
      return null

    if (!organization)
      return (
        <Card>
          <CardHeader
            title="Not found"
            subtitle="Sorry, we can't seem to find what you're looking for."
          />
        </Card>
      )

    return loading ? null : (
      <Card>
        <CardTitle
          title={ user ? `Hi, ${user.firstName}.` : 'Welcome.'}
          subtitle={`Start texting for ${organization.name}.`}
        />
        <CardText>
          { user ? (
              <Formsy.Form
                onValidSubmit={this.handleExistingUserJoin.bind(this)}
              >
                <RaisedButton
                  primary
                  type="submit"
                  label={`Join ${organization.name}`}
                />
              </Formsy.Form>
          ) : <TexterSignupForm organization={organization} /> }
        </CardText>
      </Card>
      // <TexterSignup user={user} organization={organization} />
    )

  }
}

export default createContainer(({ organizationId, organizations }) => {
  const handle = Meteor.subscribe('organization', organizationId)
  return {
    organization: Organizations.findOne({ _id: organizationId }),
    user: Meteor.user(),
    loading: !handle.ready()
  }
}, Page)
