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

import getMuiTheme from 'material-ui/styles/getMuiTheme';

import Subheader from 'material-ui/Subheader'
const styles = {

  root: {
    // marginBottom: '4px'
    // border: '1px solid grey',
  },
  form: {
    marginBottom: '24px',
    padding: '6px 42px 24px 42px',
  },
  preview: {
    backgroundColor: 'lightgray',
    border: '1px solid gray',
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
    console.log(props.script)
    this.state = {
      editorState: EditorState.createWithContent(ContentState.createFromText(props.script)),
      suggestions: fromJS([]),
      editing: false
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
    const script = this.state.editorState.getCurrentContent().getPlainText()
    return sampleContact && script !== ''? (
      <div style={styles.preview}>
        <label>Preview</label>
        <div>
        {applyScript(script, convertRowToContact(sampleContact), scriptFields(customFields) )}
        </div>
      </div>
    ) : ''
  }
  render() {
    const {titleEditable, title } = this.props
    console.log(title)
    const toolbar = [
      <Divider />,
      <Toolbar style={styles.toolbar}>
        <ToolbarGroup float="right">
          <IconButton>
            <DeleteIcon tooltip="Delete script" />
          </IconButton>
        </ToolbarGroup>
      </Toolbar>
  ]


  // <TextField
  //   multiLine
  //   fullWidth
  //   underlineShow={this.state.editing}
  //   value="No problem! You can still participate. Try on your tablet, {firstName}"
  // />



    return (
      <Paper zDepth={this.state.editing ? 2 : 1}>
        <div style={styles.root} onClick={ this.onFocus }>
          <div style={styles.form}>
            { titleEditable ? <TextField
              style={styles.scriptTitle}
              underlineShow={this.state.editing}
              value={title}
            /> : ''}
            <br />

            <div style={styles.editor}>
            <Editor
              editorState={ this.state.editorState }
              onChange={this.onChange}
              // onFocus={this.onFocus}
              // onBlur={this.onBlur}
              plugins={plugins}
              ref="editor"
            />
          </div>
          {this.state.editing ? this.renderPreview() : ''}
        </div>
        { this.state.editing && titleEditable ? toolbar : ''}
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
