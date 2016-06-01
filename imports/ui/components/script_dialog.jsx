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
const styles = {

  root: {
    // marginBottom: '4px'
    // border: '1px solid grey',
  },
  form: {
    marginBottom: '16px',
    padding: '6px 16px',
  },
  preview: {
    opacity: 0.4,
    fontSize: '10px'
  },
  toolbar: {
    backgroundColor: "lightgray",
    opacity: 0.3
  },
  scriptTitle: {
    fontWeight: 'bold'
  },
  editor: {
    fontSize: 16,
    marginTop: '12px',
    lineHeight: '24px',
    borderBottom: '2px solid #e0e0e0'
    // display: 'inline-block',
    // position: 'relative',
  }
}
// const positionSuggestions = ({ state, props }) => {
//   let transform;
//   let transition;

//   if (state.isActive & props.suggestions.size > 0) {
//     transform = 'scaleY(1)';
//     transition = 'all 0.25s cubic-bezier(.3,1.2,.2,1)';
//   } else if (state.isActive) {
//     transform = 'scaleY(0)';
//     transition = 'all 0.25s cubic-bezier(.3,1,.2,1)';
//   }

//   return {
//     transform,
//     transition,
//   };
// };

const mentionPlugin = createMentionPlugin({
  entityMutability: 'IMMUTABLE',
  // positionSuggestions,
  mentionPrefix: '',
});
const { MentionSuggestions } = mentionPlugin;
const plugins = [mentionPlugin];


// const mentionPlugin = createMentionPlugin();
// const { MentionSuggestions } = mentionPlugin;
// const plugins = [mentionPlugin];

export class ScriptDialog extends Component {

  constructor(props) {
    super(props)
    this.onChange = this.onChange.bind(this)
    this.onSearchChange = this.onSearchChange.bind(this)
    this.onScriptDelete = this.onScriptDelete.bind(this)
    this.onFocus = this.onFocus.bind(this)
    this.onBlur = this.onBlur.bind(this)

    const {script} = props
    // this.state = {
    //   editorState: EditorState.createWithContent(ContentState.createFromText(props.script)),
    //   suggestions: fromJS([]),
    //   editing: false,
    //   script: props.script,
    //   title: props.title,
    // }

    this.state = {
      editorState: EditorState.createWithContent(ContentState.createFromText(script.script)),
      suggestions: fromJS([]),
      editing: false,
      script: script
      // scriptFieldValue: props.script.script
    }
  }

  onScriptDelete() {
    this.setState({editing: true})
    const { script, onScriptDelete } = this.props
    onScriptDelete(script._id)

  }
  // onChange (event) {
  //   const scriptFieldValue = event.target.value
  //   this.setState({scriptFieldValue})

  //   const scriptId = this.props.script._id
  //   this.props.onScriptChange(scriptId, {script: scriptFieldValue})
  // }

  onChange (editorState) {

    this.setState({
      editorState,
    });

    var text = editorState.getCurrentContent().getPlainText();
    this.props.onScriptChange(text)
  }

  formatMentions(fields) {
    return fromJS(fields.map((field) => ({ name: field })))
  }

  onSearchChange ({ value }) {
    const mentions = this.formatMentions(this.props.customFields)

    console.log("onSearchChange", mentions)
    this.setState({
      suggestions: defaultSuggestionsFilter(value, mentions),
    });
  }

  onFocus () {
    // this.refs.editor.focus();
    this.setState({ editing: true })
  }

  onBlur() {
    this.setState({ editing: false })
  }

  currentScriptValue() {
    const { editorState } = this.state
    return editorState.getCurrentContent().getPlainText()
  }

  renderPreview() {
    const { customFields } = this.props
    // FIXME
    const sampleContact = {firstName: 'Sally', lastName: 'Mockingbird', cell: '202020'}

    const scriptFieldValue = this.currentScriptValue()
    console.log("render preview", scriptFieldValue, sampleContact)
    return sampleContact && scriptFieldValue !== '' ? (
      <div style={styles.preview}>
        {applyScript(scriptFieldValue, convertRowToContact(sampleContact), scriptFields(customFields) )}
      </div>
    ) : ''
  }

  addText(event) {
    event.preventDefault()
    var caretPos = this.refs.scriptField.input.selectionStart;
    var textAreaTxt = this.state.scriptFieldValue ;
    var txtToAdd = "text to add!";
    const newText = (textAreaTxt.substring(0, caretPos) + txtToAdd + textAreaTxt.substring(caretPos) )
    this.refs.scriptField.input.focus()
    this.setState({
      scriptFieldValue: newText,
      // otherwise field gets blurred
      editing: true
    })

  }
  render() {
    const { title, isFaqReply } = this.props.script

    const toolbar = [
      <Divider />,
      <Toolbar style={styles.toolbar}>
        <ToolbarGroup
          float="left"
          firstChild
        >
          {this.state.editing ? this.renderPreview() : ''}
        </ToolbarGroup>

        <ToolbarGroup
          float="right"
          lastChild
        >
          {isFaqReply ? <IconButton onTouchTap={this.onScriptDelete}>
            <DeleteIcon tooltip="Delete script" />
          </IconButton> : ''
          }
        </ToolbarGroup>
      </Toolbar>
    ]

    return (
        <div className="row" style={styles.root} onClick={ this.onFocus }>
          <div className="col-xs">
            <Editor
              editorState={ this.state.editorState }
              onChange={this.onChange}
              onFocus={this.onFocus}
              onBlur={this.onBlur}
              plugins={plugins}
              value="No problem! You can still participate. Try {firstName} on your tablet."
              ref="editor"
            />
            <MentionSuggestions
              onSearchChange={ this.onSearchChange }
              suggestions={ this.state.suggestions }
            />
        </div>
        <div className="col-xs">
          {this.renderPreview()}
        </div>

      </div>
    );
  }
}