import PropTypes from 'prop-types'
import React from 'react'
import loadData from './hoc/load-data'
import wrapMutations from './hoc/wrap-mutations'
import gql from 'graphql-tag'

import GSForm from '../components/forms/GSForm'
import Form from 'react-formal'
import yup from 'yup'
import Dialog from 'material-ui/Dialog'
import RaisedButton from 'material-ui/RaisedButton'
import { StyleSheet, css } from 'aphrodite'

import { dataTest } from '../lib/attributes'

const styles = StyleSheet.create({
  buttons: {
    display: 'flex'
  },
  container: {
    display: 'inline-block',
    marginRight: 20,
    marginTop: 15
  }
})

class UserEdit extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      changePasswordDialog: false,
      successDialog: false
    }
    this.handleSave = this.handleSave.bind(this)
    this.handleClick = this.handleClick.bind(this)
    this.handleClose = this.handleClose.bind(this)
    this.openSuccessDialog = this.openSuccessDialog.bind(this)
    this.buildFormSchema = this.buildFormSchema.bind(this)
  }

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
    } else if (this.props.authType === 'change') {
      // change password
      const res = await this.props.mutations.changeUserPassword(formData)
      if (res.errors) {
        throw new Error(res.errors.graphQLErrors[0].message)
      }
      this.props.openSuccessDialog()
    } else {
      // log in, sign up, or reset
      const allData = {
        nextUrl: this.props.nextUrl,
        authType: this.props.authType,
        ...formData
      }
      const res = await fetch('/login-callback', {
        method: 'POST',
        body: JSON.stringify(allData),
        headers: { 'Content-Type': 'application/json' }
      })
      const { redirected, headers, status, url } = res
      if (redirected && status === 200) {
        this.props.router.replace(url)
      } else if (status === 401) {
        throw new Error(headers.get('www-authenticate') || '')
      }
    }
  }

  handleClick() {
    this.setState({ changePasswordDialog: true })
  }

  handleClose() {
    if (this.props.handleClose) {
      this.props.handleClose()
    } else {
      this.setState({ changePasswordDialog: false, successDialog: false })
    }
  }

  openSuccessDialog() {
    this.setState({ successDialog: true })
  }

  buildFormSchema(authType) {
    let passwordFields = {}
    if (authType) {
      passwordFields = {
        password: yup.string().required()
      }
    }

    if (authType === 'change') {
      passwordFields = {
        ...passwordFields,
        newPassword: yup.string().required()
      }
    }

    if (authType && authType !== 'login') {
      passwordFields = {
        ...passwordFields,
        passwordConfirm: yup
          .string()
          .oneOf([yup.ref(authType === 'change' ? 'newPassword' : 'password')], 'Passwords must match')
          .required()
      }
    }

    let userFields = {}
    if (!authType || authType === 'signup') {
      userFields = {
        firstName: yup.string().required(),
        lastName: yup.string().required(),
        cell: yup.string().required()
      }
    }

    return yup.object({
      email: yup.string().email().required(),
      ...userFields,
      ...passwordFields
    })
  }

  render() {
    const { authType, editUser, style, userId, data, saveLabel } = this.props
    const user = (editUser && editUser.editUser) || {}

    const formSchema = this.buildFormSchema(authType)

    return (
      < div >
        <GSForm
          schema={formSchema}
          onSubmit={this.handleSave}
          defaultValue={user}
          className={style}
        >
          <Form.Field label='Email' name='email' {...dataTest('email')} />
          {(!authType || authType === 'signup') &&
            <span>
              <Form.Field label='First name' name='firstName' {...dataTest('firstName')} />
              <Form.Field label='Last name' name='lastName' {...dataTest('lastName')} />
              <Form.Field label='Cell Number' name='cell' {...dataTest('cell')} />
            </span>
          }
          {authType &&
            <Form.Field label='Password' name='password' type='password' />
          }
          {authType === 'change' &&
            <Form.Field label='New Password' name='newPassword' type='password' />
          }
          {authType && authType !== 'login' &&
            <Form.Field label='Confirm Password' name='passwordConfirm' type='password' />
          }
          <div className={css(styles.buttons)}>
            {authType !== 'change' && userId && (userId === data.currentUser.id) &&
              <div className={css(styles.container)}>
                <RaisedButton
                  onTouchTap={this.handleClick}
                  label='Change password'
                  variant='outlined'
                />
              </div>}
            <Form.Button
              type='submit'
              label={saveLabel || 'Save'}
            />
          </div>
        </GSForm>
        <div>
          <Dialog
            {...dataTest('changePasswordDialog')}
            title='Change your password'
            modal={false}
            open={this.state.changePasswordDialog}
            onRequestClose={this.handleClose}
          >
            <UserEdit
              authType='change'
              saveLabel='Save new password'
              handleClose={this.handleClose}
              openSuccessDialog={this.openSuccessDialog}
              userId={this.props.userId}
              mutations={this.props.mutations}
            />
          </Dialog>
          <Dialog
            {...dataTest('successPasswordDialog')}
            title='Password changed successfully!'
            modal={false}
            open={this.state.successDialog}
            onRequestClose={this.handleClose}
            onBackdropClick={this.handleClose}
            onEscapeKeyDown={this.handleClose}
          >
            <RaisedButton
              onTouchTap={this.handleClose}
              label='OK'
              primary
            />
          </Dialog>
        </div>
      </div>
    )
  }
}

UserEdit.propTypes = {
  mutations: PropTypes.object,
  data: PropTypes.object,
  router: PropTypes.object,
  editUser: PropTypes.object,
  userId: PropTypes.string,
  organizationId: PropTypes.string,
  onRequestClose: PropTypes.func,
  saveLabel: PropTypes.string,
  authType: PropTypes.string,
  nextUrl: PropTypes.string,
  style: PropTypes.string,
  handleClose: PropTypes.func,
  openSuccessDialog: PropTypes.func
}

const mapQueriesToProps = ({ ownProps }) => {
  if (ownProps.userId) {
    return {
      data: {
        query: gql` query getCurrentUser {
          currentUser {
            id
          }
        }`
      }
    }
  }
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
      }),
      changeUserPassword: (formData) => ({
        mutation: gql`
          mutation changeUserPassword($userId: Int!, $formData: UserPasswordChange) {
            changeUserPassword(userId: $userId, formData: $formData) {
              id
            }
          }
        `,
        variables: {
          userId: ownProps.userId,
          formData
        }
      })
    }
  }
}

export default loadData(wrapMutations(UserEdit), { mapQueriesToProps, mapMutationsToProps })
