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

import Subheader from 'material-ui/Subheader'
const styles = {

  root: {
    // marginBottom: '4px'
    // border: '1px solid grey',
  },
  form: {
    marginBottom: '16px',
    padding: '16px',
  },
  preview: {
    backgroundColor: 'lightgray',
    // border: '1px solid gray',
    padding: '6px',
    opacity: 0.3
  },
  toolbar: {
    backgroundColor: "lightgray",
    opacity: 0.2
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

export class ScriptEditor extends Component {

  constructor(props) {
    super(props)
    this.onChange = this.onChange.bind(this)
    this.onSearchChange = this.onSearchChange.bind(this)
    this.onFocus = this.onFocus.bind(this)
    this.onBlur = this.onBlur.bind(this)
    console.log("props, script", props.script)
    this.state = {
      editorState: EditorState.createWithContent(ContentState.createFromText(props.script)),
      suggestions: fromJS([]),
      editing: false,
      script: props.script,
      title: props.title,
    }
  }

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

  renderPreview() {
    const { sampleContact, customFields } = this.props
    console.log()
    // const script = this.state.editorState.getCurrentContent().getPlainText()
    const script = this.state.script
    console.log("render preview", script, sampleContact)
    return sampleContact && script !== '' ? (
      <div style={styles.preview}>
        <label>Preview</label>
        <div>
        {applyScript(script, convertRowToContact(sampleContact), scriptFields(customFields) )}
        </div>
      </div>
    ) : ''
  }

  render() {
    const { title, isFaqReply } = this.props

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
          {isFaqReply ? <IconButton>
            <DeleteIcon tooltip="Delete script" />
          </IconButton> : ''
          }
        </ToolbarGroup>
      </Toolbar>
    ]

    return (
      <Paper zDepth={this.state.editing ? 1 : 0}>
        <div style={styles.root} onClick={ this.onFocus }>
          <div style={styles.form}>
              <Formsy.Form
                // onValid={this.enableButton.bind(this)}
                // onInvalid={this.disableButton.bind(this)}
              >
                {isFaqReply ? <FormsyText
                  name="title"
                  value={title}
                    onFocus={this.onFocus}
                    onBlur={this.onBlur}
                  underlineShow={this.state.editing}
                  required
                /> : ''}
                <FormsyText
                  required
                  multiLine
                  fullWidth
                  onFocus={this.onFocus}
                  onBlur={this.onBlur}
                  onChange={(event, script) => this.setState({script})}
                  value={this.state.script}
                  name="script"
                  type="script"
                />
              </Formsy.Form>
        </div>
        { this.state.editing ? toolbar : ''}
      </div>
      {this.state.editing ? <MentionSuggestions
        onSearchChange={ this.onSearchChange }
        suggestions={ this.state.suggestions }
      /> : ''}

    </Paper>
    );
  }
}

// <div style={styles.editor}>
// <Editor
//   editorState={ this.state.editorState }
//   onChange={this.onChange}
//   onFocus={this.onFocus}
//   onBlur={this.onBlur}
//   plugins={plugins}
//   value="No problem! You can still participate. Try {firstName} on your tablet."
//   ref="editor"
// />
// </div>
