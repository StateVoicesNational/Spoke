import React, { Component } from 'react';
import { Factory } from 'meteor/dburles:factory'
import { EditorState } from 'draft-js';
import Editor from 'draft-js-plugins-editor';
import Paper from 'material-ui/Paper'
import createMentionPlugin, { defaultSuggestionsFilter } from 'draft-js-mention-plugin';
import { fromJS } from 'immutable'
import { applyScript, scriptFields } from '../helpers/script_helpers'
import { convertRowToContact } from '../../api/campaign_contacts/parse_csv'

import Subheader from 'material-ui/Subheader'
const styles = {
  input: {
    padding: "8px 0"
  }
}
const positionSuggestions = ({ state, props }) => {
  let transform;
  let transition;

  if (state.isActive & props.suggestions.size > 0) {
    transform = 'scaleY(1)';
    transition = 'all 0.25s cubic-bezier(.3,1.2,.2,1)';
  } else if (state.isActive) {
    transform = 'scaleY(0)';
    transition = 'all 0.25s cubic-bezier(.3,1,.2,1)';
  }

  return {
    transform,
    transition,
  };
};

const mentionPlugin = createMentionPlugin({
  entityMutability: 'IMMUTABLE',
  positionSuggestions,
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
    this.focus = this.focus.bind(this)
    this.state = {
      editorState: EditorState.createEmpty(),
      suggestions: fromJS([]),
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
    console.log("fields", fields, fields.map((field) => { return {name: field }}))
    return fromJS(fields.map((field) => ({ name: field })))
  }
  onSearchChange ({ value }) {
    const mentions = this.formatMentions(this.props.customFields)


    this.setState({
      suggestions: defaultSuggestionsFilter(value, mentions),
    });
  }

  focus () {
    this.refs.editor.focus();
  }

  renderPreview() {
    const { sampleContact, customFields } = this.props
    console.log("sampleContact", sampleContact)
    const script = this.state.editorState.getCurrentContent().getPlainText()
    return sampleContact ? (
      <div>
        <h3>Preview</h3>
        {applyScript(script, convertRowToContact(sampleContact), scriptFields(customFields) )}
      </div>
    ) : ''
  }
  render() {
    return (
      <div className="row">
        <div className="col-xs">
          <div onClick={ this.focus }
            style={styles.input}
          >
            <Editor
              // placeholder="Type { to see available custom fields."
              editorState={ this.state.editorState }
              onChange={this.onChange}
              plugins={plugins}
              ref="editor"
            />
            <MentionSuggestions
              onSearchChange={ this.onSearchChange }
              suggestions={ this.state.suggestions }
          />
          </div>
        </div>
        <div className="col-xs">
          {this.renderPreview()}
        </div>
      </div>
    );
  }
}