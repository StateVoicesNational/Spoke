import PropTypes from 'prop-types'
import React from 'react'
import loadData from './hoc/load-data'
import wrapMutations from './hoc/wrap-mutations'
import gql from 'graphql-tag'

import GSForm from '../components/forms/GSForm'
import Form from 'react-formal'
import yup from 'yup'

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
    await this.props.mutations.editUser(null)
  }

  async handleSave(formData) {
    await this.props.mutations.editUser(formData)
    if (this.props.onRequestClose) {
      this.props.onRequestClose()
    }
  }

  render() {
    const user = (this.props.editUser && this.props.editUser.editUser) || {}

    let passwordFields = {}
    if (this.props.allowSetPassword) {
      passwordFields = {
        password: yup.string().required(),
        passwordConfirm: yup
          .string()
          .oneOf([yup.ref('password')], 'Passwords must match')
          .required()
      }
    }

    const formSchema = yup.object({
      firstName: yup.string().required(),
      lastName: yup.string().required(),
      cell: yup.string().required(),
      email: yup.string().email(),
      ...passwordFields
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
        {(this.props.allowSetPassword
          ? <div>
            <Form.Field label='Password' name='password' type='password' />
            <Form.Field label='Confirm Password' name='passwordConfirm' type='password' />
          </div>
         : null)}
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
  editUser: PropTypes.object,
  userId: PropTypes.string,
  organizationId: PropTypes.string,
  onRequestClose: PropTypes.func,
  saveLabel: PropTypes.string,
  allowSetPassword: PropTypes.bool
}

const mapMutationsToProps = ({ ownProps }) => {
  if (ownProps.userId) {
    return {
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
    }
  }
}

export default loadData(wrapMutations(UserEdit), { mapMutationsToProps })
