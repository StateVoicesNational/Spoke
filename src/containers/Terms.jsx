import React from 'react';
import loadData from './hoc/load-data'
import gql from 'graphql-tag'
import {
  Card,
  CardTitle,
  CardActions,
  CardText,
} from 'material-ui/Card';
import RaisedButton from 'material-ui/RaisedButton';
import wrapMutations from './hoc/wrap-mutations'
import { withRouter } from 'react-router'

class Terms extends React.Component {

  handleTermsAgree = async () => {
    const { data, router, mutations, location } = this.props
    const userData = await mutations.userAgreeTerms(data.currentUser.id)
    if (userData.data.userAgreeTerms.terms) { router.push(location.query.next) }
  }

  render() {
    return (
      <div styles={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <Card>
          <CardTitle title="Code Of Conduct" subtitle="What to expect" />
          <CardText>
            <h3><u>Inappropriate Behaviour</u></h3>
              <p styles={{padding: '20px 0'}}>
                Occasionally someone might be rude or use inappropriate language to you — please don’t engage or respond in kind. We will make sure that person isn’t contacted again. 
              </p>
            <h3><u>Commit to Reply</u></h3>
              <p styles={{padding: '20px 0'}}>Please commit to responding to people who reply to you. We're attempting to grow trust and understanding in our community and maintaining an open dialogue is key.</p>
            <h3><u>Retention</u></h3>
              <p styles={{padding: '20px 0'}}>
                GetUp maintains a record of all conversations on this Spoke account.
              </p>
          </CardText>
          <CardActions>
          <RaisedButton
            primary={true}
            label="Agree"
            onClick={this.handleTermsAgree}
          />
          </CardActions>
        </Card>
      </div>
    )
  }
}

Terms.propTypes = {
  mutations: React.PropTypes.object,
  router: React.PropTypes.object,
  data: React.PropTypes.object
}

const mapQueriesToProps = () => ({
  data: {
    query: gql` query getCurrentUser {
      currentUser {
        id,
        terms
      }
    }`
  }
})

const mapMutationsToProps = (ownProps) => ({
  userAgreeTerms: (userId) => ({
    mutation: gql`
        mutation userAgreeTerms($userId: String!) {
          userAgreeTerms(userId: $userId) {
            id
            terms
          }
        }`,
    variables: {
      userId
    }
  })
})

export default loadData(wrapMutations(withRouter(Terms)), { mapQueriesToProps, mapMutationsToProps })
