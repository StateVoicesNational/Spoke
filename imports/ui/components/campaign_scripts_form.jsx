import React, { Component } from 'react'
import FlatButton from 'material-ui/FlatButton'
import RaisedButton from 'material-ui/RaisedButton'
import { ScriptEditor } from './script_editor'
import Dialog from 'material-ui/Dialog'
import { CampaignContacts } from '../../api/campaign_contacts/campaign_contacts'
import { ScriptTypes } from '../../api/campaigns/scripts'
import TextField from 'material-ui/TextField'
import Divider from 'material-ui/Divider'
import { muiTheme } from '../../ui/theme'
import { CampaignFormSectionHeading } from './campaign_form_section_heading'
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';
import DeleteIcon from 'material-ui/svg-icons/action/delete'
import EditIcon from 'material-ui/svg-icons/image/edit'
import IconButton from 'material-ui/IconButton'
const styles = {
  icon: {
    width: 18,
    height: 18,
  },
  button: {
    width: 22,
    height: 18,
  },
  scriptRow: {
    borderLeft: `5px solid ${muiTheme.palette.primary1Color}`
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
    this.state = {
      open: false
    }
  }

  handleOpenDialog() {
    this.setState({ open: true })
  }

  handleCloseDialog() {
    this.setState({ open: false, editingScript: null })
  }

  getModel() {
    // TODO: Extend Formsy to enclose Draft.js editor
    return _.extend(this.refs.form.getModel(), {
      text: this.refs.scriptInput.getValue(),
      type: this.state.editingScript.type
    })
  }

  handleSaveScript() {
    const { editingScript } = this.state
    const scriptData = this.getModel()

    if (editingScript._id) {
      const { onScriptChange } = this.props
      onScriptChange(editingScript._id, scriptData)
    } else {
      const { handleAddScript } = this.props
      handleAddScript(_.extend(editingScript, scriptData))
    }
    this.handleCloseDialog()
  }

  handleAddScript() {
    const script = {
      type: ScriptTypes.INITIAL,
      text: '',
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
    this.setState( { editingScript: script })
    this.handleOpenDialog()
  }

  renderDialog() {
    const { editingScript, open } = this.state
    return (
      <Dialog
        actions={[
          <FlatButton
            label="Cancel"
            onTouchTap={this.handleCloseDialog}
          />,
          <RaisedButton
            label="Done"
            onTouchTap={this.handleSaveScript}
            primary
          />
        ]}
        modal
        open={open}
        onRequestClose={this.handleCloseDialog}
      >
        { editingScript ? this.renderForm() : ' '}
      </Dialog>
    )
  }

  renderForm() {
    const {
      sampleContact,
      customFields } = this.props

    const { editingScript } = this.state
    console.log("editingScript in renderForm", editingScript)

    const scriptFields = CampaignContacts.requiredUploadFields.concat(CampaignContacts.userScriptFields).concat(customFields)
    console.log("editing field")
    const titleField = editingScript.type !== ScriptTypes.FAQ ? '' : (
      <TextField
        fullWidth
        name="title"
        floatingLabelText="Reply label"
        hintText="E.g. Can I attend only part of the event?"
        value={ editingScript.title }
      />
    )

    return (
      <Formsy.Form
        ref="form"
      >
        { titleField }
        <ScriptEditor
          name="text"
          ref="scriptInput"
          script={editingScript}
          sampleContact={sampleContact}
          scriptFields={scriptFields}
        />
      </Formsy.Form>

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
      customFields } = this.props

    const sectionHeading = (title, subtitle) => [
      <h3 style={styles.scriptSectionTitle}>{title}</h3>,
      <h4 style={styles.scriptSectionSubtitle}>{subtitle}</h4>
    ]

    // const { handleAddScript } = this.props
    // handleAddScript(script)

    return (
      <div>
        <CampaignFormSectionHeading
          title='What do you want to say?'
        />
        <div style={styles.scriptSection}>
          { sectionHeading('First message script', "This script is what we'll automatically fill in for texters when they first send the first message to a contact.")}
          { this.renderScriptRow(script)}
        </div>
        <Divider />
          <div style={styles.scriptSection}>
          { sectionHeading('Saved replies', "These replies will appear in a list for texters to choose to answer common issues and questions when a contact has responded. You can think of it as a FAQ section of sorts.")}
          { faqScripts.map((faqScript) => this.renderScriptRow(faqScript))}
        </div>
        <RaisedButton
          label={'Add saved reply'}
          onTouchTap={this.handleAddSavedReply }
        />
        { this.renderDialog()}
      </div>
    )
  }
}
