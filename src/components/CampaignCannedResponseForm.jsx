import type from 'prop-types'
import React from 'react'
import { StyleSheet, css } from 'aphrodite'
import yup from 'yup'
import GSForm from './forms/GSForm'
import Form from 'react-formal'
import FlatButton from 'material-ui/FlatButton'
import { dataTest } from '../lib/attributes'

const styles = StyleSheet.create({
  buttonRow: {
    marginTop: 5
  }
})

// THIS IS A COPY/PASTE FROM CANNED RESPONSE FORM BECAUSE I CANT MAKE FORM.CONTEXT WORK
class CannedResponseForm extends React.Component {
  handleSave = (formValues) => {
    const { onSaveCannedResponse } = this.props
    onSaveCannedResponse(formValues)
  }

  render() {
    const modelSchema = yup.object({
      title: yup.string().required(),
      text: yup.string().required()
    })

    const { customFields } = this.props
    return (
      <div>
        <GSForm
          ref='form'
          schema={modelSchema}
          onSubmit={this.handleSave}
        >
          <Form.Field
            {...dataTest('title')}
            name='title'
            autoFocus
            fullWidth
            label='Title'
          />
          <Form.Field
            {...dataTest('editorResponse')}
            customFields={customFields}
            name='text'
            type='script'
            label='Script'
            multiLine
            fullWidth
          />
          <div className={css(styles.buttonRow)}>
            <Form.Button
              {...dataTest('addResponse')}
              type='submit'
              label='Add Response'
              style={{
                display: 'inline-block'
              }}
            />
            <FlatButton
              label='Cancel'
              onClick={() => this.setState({ showForm: false })}
              style={{
                marginLeft: 5,
                display: 'inline-block'
              }}
            />
          </div>
        </GSForm>
      </div>
    )
  }
}

CannedResponseForm.propTypes = {
  onSaveCannedResponse: type.func,
  customFields: type.array
}


export default CannedResponseForm
