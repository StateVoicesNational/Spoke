import React, { Component } from 'react';
import { EditorState } from 'draft-js';
import Editor from 'draft-js-plugins-editor';
import createMentionPlugin, { defaultSuggestionsFilter } from 'draft-js-mention-plugin';
import { fromJS } from 'immutable'
import { applyScript } from '../helpers/script_helpers'
import { convertRowToContact } from '../../api/campaign_contacts/parse_csv'

const styles = {
  input: {
    borderBottom: "1px solid lightgray",
    padding: "16px"
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
    const { sampleContact } = this.props
    const script = this.state.editorState.getCurrentContent().getPlainText()
    return sampleContact ? (
      <div>
        <h3>Preview</h3>
        {applyScript(script, convertRowToContact(sampleContact))}
      </div>) : ''
  }
  render() {
    return (
      <div className="row">
        <div className="col-xs">
          <h3>Script</h3>
          <div onClick={ this.focus }
            style={styles.input}
          >
            <Editor
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