import React, { Component } from 'react';
import { Factory } from 'meteor/dburles:factory'
import { EditorState, ContentState } from 'draft-js';
import Editor from 'draft-js-plugins-editor';
import Paper from 'material-ui/Paper'
import TextField from 'material-ui/TextField'
import TextFieldUnderline from 'material-ui/TextField/TextFieldUnderline'
import Divider from 'material-ui/Divider'
import createMentionPlugin, { defaultSuggestionsFilter } from 'draft-js-mention-plugin';
import { fromJS } from 'immutable'
import { applyScript, scriptFields } from '../helpers/script_helpers'
import { convertRowToContact } from '../../api/campaign_contacts/parse_csv'
import { Toolbar, ToolbarGroup } from 'material-ui/Toolbar'
import IconButton from 'material-ui/IconButton/IconButton'
import DeleteIcon from 'material-ui/svg-icons/action/delete';
import Formsy from 'formsy-react';
import { FormsyCheckbox, FormsyDate, FormsyRadio, FormsyRadioGroup,
    FormsySelect, FormsyText, FormsyTime, FormsyToggle } from 'formsy-material-ui/lib'
import RaisedButton from 'material-ui/RaisedButton'
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import { Chip } from './chip'
import Subheader from 'material-ui/Subheader'


export class ScriptDialog extends Component {

  constructor(props) {
    super(props)
    this.onChange = this.onChange.bind(this)
    this.onSearchChange = this.onSearchChange.bind(this)
    this.onScriptDelete = this.onScriptDelete.bind(this)
    this.onFocus = this.onFocus.bind(this)
    this.onBlur = this.onBlur.bind(this)

    const {script} = props
    this.state = {
      editorState: EditorState.createWithContent(ContentState.createFromText(script.script)),
      suggestions: fromJS([]),
      editing: false,
      script: script
      // scriptFieldValue: props.script.script
    }
  }

  renderPreview() {
    const { customFields } = this.props
    // FIXME
    const sampleContact = {firstName: 'Sally', lastName: 'Mockingbird', cell: '202020'}

    const scriptFieldValue = this.currentScriptValue()
    return sampleContact && scriptFieldValue !== '' ? (
      <div style={styles.preview}>
        {applyScript(scriptFieldValue, convertRowToContact(sampleContact), scriptFields(customFields) )}
      </div>
    ) : ''
  }

  render() {
    const {
      faqScripts,
      script,
      handleSaveScriptRow,
      onScriptChange,
      onScriptDelete,
      sampleContact,
      customFields } = this.props

    const scriptFields = CampaignContacts.requiredUploadFields.concat(CampaignContacts.userScriptFields).concat(customFields)
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
        open={this.state.open}
        onRequestClose={this.handleCloseDialog}
      >
        <TextField
          floatingLabelText="Common issue"
        />
        <ScriptEditor
          expandable
          ref="scriptField"
          script={this.state.editingScript}
          sampleContact={sampleContact}
          scriptFields={scriptFields}
        />
      </Dialog>
    )
  }
}