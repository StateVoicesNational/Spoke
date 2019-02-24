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
    if (!this.props.authType) {
      await this.props.mutations.editUser(null)
    }
  }

  async handleSave(formData) {
    if (!this.props.authType) {
      await this.props.mutations.editUser(formData)
      if (this.props.onRequestClose) {
        this.props.onRequestClose()
      }
    } else {
      // log in or sign up
      const allData = {
        nextUrl: this.props.location.query.nextUrl,
        ...formData
      }
      const res = await fetch('/login-callback', {
        method: 'POST',
        body: JSON.stringify(allData),
        headers: { 'Content-Type': 'application/json' }
      })
      const { redirected, status, url } = res
      if (redirected && status === 200) {
        this.props.router.push(url)
      } else if (!redirected && status === 401) {
        throw new Error('Invalid username or password')
      } else {
        throw new Error()
      }
    }
  }

  render() {
    const user = (this.props.editUser && this.props.editUser.editUser) || {}

    let passwordFields = {}
    if (this.props.authType) {
      passwordFields = {
        password: yup.string().required()
      }
    }

    if (this.props.authType === 'signup') {
      passwordFields = {
        ...passwordFields,
        passwordConfirm: yup
          .string()
          .oneOf([yup.ref('password')], 'Passwords must match')
          .required()
      }
    }

    let userFields = {}
    if (this.props.authType !== 'login') {
      userFields = {
        firstName: yup.string().required(),
        lastName: yup.string().required(),
        cell: yup.string().required()
      }
    }

    const formSchema = yup.object({
      email: yup.string().email().required(),
      ...userFields,
      ...passwordFields
    })

    return (
      <GSForm
        schema={formSchema}
        onSubmit={this.handleSave}
        defaultValue={user}
        className={this.props.style}
      >
        <Form.Field label='Email' name='email' {...dataTest('email')} />
        {(this.props.authType !== 'login') &&
          <div className={this.props.style}>
            <Form.Field label='First name' name='firstName' {...dataTest('firstName')} />
            <Form.Field label='Last name' name='lastName' {...dataTest('lastName')} />
            <Form.Field label='Cell Number' name='cell' {...dataTest('cell')} />
          </div>
        }
        {(this.props.authType) &&
          <Form.Field label='Password' name='password' type='password' />
        }
        {this.props.authType === 'signup' &&
          <Form.Field label='Confirm Password' name='passwordConfirm' type='password' />
        }
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
  authType: PropTypes.string,
  location: PropTypes.object,
  style: PropTypes.string
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
