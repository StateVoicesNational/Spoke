import React, { Component } from 'react'
import FlatButton from 'material-ui/FlatButton'
import RaisedButton from 'material-ui/RaisedButton'
import Formsy from 'formsy-react'
import { ScriptEditor } from './script_editor'
import Dialog from 'material-ui/Dialog'
import { ScriptTypes, ScriptSchema, allScriptFields } from '../../api/campaigns/scripts'
import { FormsyText } from 'formsy-material-ui/lib'
import Divider from 'material-ui/Divider'
import { muiTheme } from '../../ui/theme'
import { CampaignFormSectionHeading } from './campaign_form_section_heading'
import { Card, CardActions, CardHeader, CardText } from 'material-ui/Card'
import DeleteIcon from 'material-ui/svg-icons/action/delete'
import EditIcon from 'material-ui/svg-icons/image/edit'
import IconButton from 'material-ui/IconButton'
const styles = {
  icon: {
    width: 18,
    height: 18
  },
  button: {
    width: 22,
    height: 18
  },
  scriptRow: {
    borderLeft: `5px solid ${muiTheme.palette.primary1Color}`,
    marginBottom: 24
  },
  scriptTitle: {
    fontWeight: 'medium'
  },
  scriptSection: {
    marginBottom: 46
  },
  scriptSectionSubtitle: {
    color: 'gray',
    fontWeight: 'light',
    marginTop: 0,
    marginBottom: 36,
    fontSize: 12
  },
  scriptSectionTitle: {
    marginBottom: 0
  },
  titleInput: {
    marginBottom: 24
  }
}
export class CampaignScriptsForm extends Component {
  constructor(props) {
    super(props)
    this.handleOpenDialog = this.handleOpenDialog.bind(this)
    this.handleCloseDialog = this.handleCloseDialog.bind(this)
    this.handleSaveScript = this.handleSaveScript.bind(this)
    this.handleAddScript = this.handleAddScript.bind(this)
    this.handleAddSavedReply = this.handleAddSavedReply.bind(this)
    this.handleStartEditingScript = this.handleStartEditingScript.bind(this)
    this.enableDoneButton = this.enableDoneButton.bind(this)
    this.disableDoneButton = this.disableDoneButton.bind(this)
    this.state = {
      open: false,
      title: null, // controlled input title
      text: null,
      editingScript: null
    }
  }

  componentDidMount() {
    const { onValid } = this.props
    onValid()
  }

  handleOpenDialog() {
    this.setState({ open: true }, () => this.focusDialog())
    // console.log("THIS refs", this.refs, this.refs.scriptInput, this.refs.form, this.refs['scriptInput'])
    // this.refs.scriptInput.focus()
  }

  handleCloseDialog() {
    this.setState({ open: false, editingScript: null })
  }

  focusDialog() {
    if (this.refs.titleInput) {
      this.refs.titleInput.focus()
    } else {
      this.refs.scriptInput.focus()
    }
  }

  getModel() {
    const { text, title, editingScript } = this.state
    const type = editingScript.type
    let model = {
      text,
      type
    }
    if (type === ScriptTypes.FAQ) {
      model['title'] = title
    }
    return model
  }


  handleSaveScript(data, resetForm, invalidateForm) {

    const { editingScript } = this.state
    const scriptData = this.getModel()
    const context = ScriptSchema.namedContext('formContext')

    console.log('validating script data?', scriptData)
    const isValid = context.validate(scriptData)
    if (!isValid) {
      console.log("invalid script data")
      const errors = {}
      _.each(context.invalidKeys(), ({ name, type }) => errors[name] = type)
      console.log(errors)
      invalidateForm(errors)
    } else {
      console.log("valid script data")
      if (editingScript._id) {
        console.log("EDITING SCRIPT", editingScript)
        const { onScriptChange } = this.props
        onScriptChange(editingScript._id, scriptData)
      } else {
        console.log("EDITING SCRIPT", editingScript)
        const { onScriptAdd } = this.props
        onScriptAdd(_.extend(editingScript, scriptData))
      }
      this.handleCloseDialog()
    }
  }

  handleAddScript() {
    const script = {
      type: ScriptTypes.INITIAL,
      text: ''
    }

    this.handleStartEditingScript(script)
  }

  handleAddSavedReply() {
    const script = {
      type: ScriptTypes.FAQ,
      text: '',
      title: ''
    }
    this.handleStartEditingScript(script)
  }

  handleStartEditingScript(script) {
    this.setState({ editingScript: script, title: script.title, text: script.text })
    this.handleOpenDialog()
  }

  enableDoneButton() {
    this.setState({ scriptDialogButtonEnabled: true })
  }
  disableDoneButton() {
    this.setState({ scriptDialogButtonEnabled: false })
  }

  submit() {
    this.refs.form.submit()
  }
  renderDialog() {
    const { editingScript, open } = this.state
    return (
      <Formsy.Form
        ref="form"
        onValid={this.enableDoneButton}
        onInvalid={this.disableDoneButton}
        onValidSubmit={this.handleSaveScript.bind(this)}
        onInvalidSubmit={this.notifyFormError.bind(this)}
      >

      <Dialog
        actions={[
          <FlatButton
            label="Cancel"
            onTouchTap={this.handleCloseDialog}
          />,
          <RaisedButton
            label="Done"
            type="submit"
            // disabled={!this.state.scriptDialogButtonEnabled}
            onTouchTap={this.submit.bind(this)}
            primary
          />
        ]}
        modal
        open={open}
        onRequestClose={this.handleCloseDialog}
      >
          { editingScript ? this.renderForm() : ' '}
      </Dialog>
      </Formsy.Form>

    )
  }

  notifyFormError(data) {
    console.error('Form error:', data)
  }

  renderForm() {
    const { sampleContact, customFields } = this.props

    const { editingScript } = this.state
    console.log('editingScript in renderForm', editingScript)

    const scriptFields = allScriptFields(customFields)
    console.log('editing field')
    const titleField = editingScript.type !== ScriptTypes.FAQ ? '' : (
      <FormsyText
        style={styles.titleInput}
        ref="titleInput"
        fullWidth
        name="title"
        onChange={(event, value) => this.setState({ title: event.currentTarget.value })}
        floatingLabelText="Reply label"
        hintText="E.g. Can I attend only part of the event?"
        value={this.state.title}
      />
    )

    return (
        <div>
        { titleField }

        <ScriptEditor
          name="text"
          ref="scriptInput"
          scriptText={this.state.text}
          sampleContact={sampleContact}
          onChange={(value) => this.setState({ text: value })}
          scriptFields={scriptFields}
        />
        </div>
    )
  }

  renderScriptRow(script) {
    const { onScriptDelete } = this.props

    return (script ? (
      <Card style={styles.scriptRow}>
        { script.title ? (
          <CardHeader
            style={styles.scriptTitle}
            title={script.title}
          />
        ) : ''
        }
        <CardText>
          {script.text}
        </CardText>
        <Divider />
        <CardActions>
          <IconButton
            iconStyle={styles.icon}
            style={styles.button}
            onTouchTap={() => this.handleStartEditingScript(script)}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            iconStyle={styles.icon}
            style={styles.icon}
            onTouchTap={() => onScriptDelete(script._id)}
          >
            <DeleteIcon />
          </IconButton>
        </CardActions>
      </Card>
    ) : (
        <RaisedButton
          label={'Add script'}
          onTouchTap={this.handleAddScript }
        />
      )
    )
  }

  render() {
    const {
      faqScripts,
      script,
      sampleContact,
      onValid,
      onInvalid,
      customFields,
    } = this.props

    const sectionHeading = (title, subtitle) => [
      <h3 style={styles.scriptSectionTitle}>{title}</h3>,
      <h4 style={styles.scriptSectionSubtitle}>{subtitle}</h4>
    ]

    // const { handleAddScript } = this.props
    // handleAddScript(script)

    return (
      <div>
        <Formsy.Form
          onValid={onValid}
          onInvalid={onInvalid}
        >
          <CampaignFormSectionHeading
            title="What do you want to say?"
          />
          <div style={styles.scriptSection}>
            { sectionHeading('First message script', "This script is what we'll automatically fill in for texters when they first send the first message to a contact.")}
            { this.renderScriptRow(script)}
          </div>
          <Divider />
            <div style={styles.scriptSection}>
            { sectionHeading('Saved replies', 'These replies will appear in a list for texters to choose to answer common issues and questions when a contact has responded. You can think of it as a FAQ section of sorts.')}
            { faqScripts.map((faqScript) => this.renderScriptRow(faqScript))}
          </div>
          <RaisedButton
            label={'Add saved reply'}
            onTouchTap={this.handleAddSavedReply }
          />
        </Formsy.Form>

          { this.renderDialog()}
      </div>
    )
  }
}
