import PropTypes from 'prop-types'
import React from 'react'
import loadData from './hoc/load-data'
import wrapMutations from './hoc/wrap-mutations'
import gql from 'graphql-tag'

import GSForm from '../components/forms/GSForm'
import GSSubmitButton from '../components/forms/GSSubmitButton'
import Form from 'react-formal'
import yup from 'yup'

import FlatButton from 'material-ui/FlatButton'
import RaisedButton from 'material-ui/RaisedButton'
import { dataTest } from '../lib/attributes'

class UserEdit extends React.Component {

  constructor(props) {
    super(props)
    this.handleSave = this.handleSave.bind(this)
  }

  state = {
    finished: false,
    stepIndex: 0
  };

  async componentWillMount() {
    const user = await this.props.mutations.editUser(null)
  }

  async handleSave(formData) {
    const result = await this.props.mutations.editUser(formData)
    if (this.props.onRequestClose) {
      this.props.onRequestClose()
    }
  }

  render() {
    const user = this.props.editUser.editUser
    const formSchema = yup.object({
      firstName: yup.string().required(),
      lastName: yup.string().required(),
      cell: yup.string().required(),
      email: yup.string().email()
    })
    return (
      <GSForm
        schema={formSchema}
        onSubmit={this.handleSave}
        defaultValue={user}
      >
        <Form.Field label='First name' name='firstName' {...dataTest('firstName')} />
        <Form.Field label='Last name' name='lastName' {...dataTest('lastName')} />
        <Form.Field label='Email' name='email' {...dataTest('email')} />
        <Form.Field label='Cell Number' name='cell' {...dataTest('cell')} />
        <Form.Button
          type='submit'
          label={this.props.saveLabel || 'Save'}
        />
      </GSForm>
    )
  }
}

UserEdit.propTypes = {
  mutations: PropTypes.object,
  router: PropTypes.object,
  userId: PropTypes.string,
  organizationId: PropTypes.string,
  onRequestClose: PropTypes.func,
  saveLabel: PropTypes.string
}

const mapMutationsToProps = ({ ownProps }) => ({
  editUser: (userData) => ({
    mutation: gql`
        mutation editUser($organizationId: String!, $userId: Int!, $userData: UserInput) {
          editUser(organizationId: $organizationId, userId: $userId, userData: $userData) {
            id,
            firstName,
            lastName,
            cell,
            email
          }
        }`,
    variables: {
      userId: ownProps.userId,
      organizationId: ownProps.organizationId,
      userData
    }
  })
})

export default loadData(wrapMutations(UserEdit), { mapMutationsToProps })
