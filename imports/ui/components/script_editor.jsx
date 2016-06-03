import React, { Component } from 'react'
import {
  EditorState,
  ContentState,
  CompositeDecorator,
  Editor,
  Modifier,
  Entity,
} from 'draft-js'
import { delimit } from '../../api/campaigns/scripts'
import AddIcon from 'material-ui/svg-icons/content/add';
import FlatButton from 'material-ui/FlatButton'
function findWithRegex(regex, contentBlock, callback) {
  const text = contentBlock.getText();
  let matchArr, start;
  while ((matchArr = regex.exec(text)) !== null) {
    start = matchArr.index;
    callback(start, start + matchArr[0].length);
  }
}


const RecognizedField = (props) => (
  <span {...props} style={styles.goodField}>{props.children}</span>
)

const UnrecognizedField = (props) => (
  <span {...props} style={styles.badField}>{props.children}</span>
)

const styles = {
  root: {
    fontFamily: '\'Helvetica\', sans-serif',
    padding: 20,
  },
  editor: {
    border: '1px solid #ddd',
    cursor: 'text',
    fontSize: 16,
    minHeight: 40,
    padding: 10,
  },
  button: {
    marginTop: 10,
    textAlign: 'center',
  },
  goodField: {
    color: 'green',
    direction: 'ltr',
    unicodeBidi: 'bidi-override',
  },
  badField: {
    color: 'red'
  },
  scriptFieldButtonLabel: {
    textTransform: 'none'
  },
  scriptFieldButton: {
    fontSize: '11px',
    border: '1px solid lightgray',
    margin: '6px'
  }
};


export class ScriptEditor extends React.Component {
  constructor(props) {
    super(props)

    const scriptFields = props.scriptFields

    this.state = {
      editorState: EditorState.createEmpty(this.getCompositeDecorator(scriptFields))
    }

    this.focus = () => this.refs.editor.focus()
    this.onChange = this.onChange.bind(this)
    this.addCustomField = this.addCustomField.bind(this)
  }

  getValue() {
    const { editorState } = this.state
    return editorState.getCurrentContent().getPlainText();
  }

  onChange(editorState) {
    this.setState( { editorState })
  }

  componentWillReceiveProps() {
    const { scriptFields } = this.props
    const { editorState } = this.state
    const decorator = this.getCompositeDecorator(scriptFields)
    const newEditorState = EditorState.set(editorState, { decorator })

    this.setState({ editorState: newEditorState })
  }

  getCompositeDecorator(scriptFields) {
    const recognizedFieldStrategy = (contentBlock, callback) => {
      const regex = new RegExp(`\{(${scriptFields.join('|')})\}`, 'g')
      return findWithRegex(regex, contentBlock, callback)
    }

    const unrecognizedFieldStrategy = (contentBlock, callback) => {
      return findWithRegex(/\{[^{]*\}/g, contentBlock, callback)
    }

    return new CompositeDecorator([
      {
        strategy: recognizedFieldStrategy,
        component: RecognizedField
      },
      {
        strategy: unrecognizedFieldStrategy,
        component: UnrecognizedField
      }
    ])
  }

  addCustomField(field) {
    const textToInsert = delimit(field)
    const { editorState } = this.state
    const selection = editorState.getSelection();
    const contentState = editorState.getCurrentContent();
    const newContentState = Modifier.insertText(contentState, selection, textToInsert);
    const newEditorState = EditorState.push(editorState, newContentState, 'insert-fragment');
    this.setState({ editorState: newEditorState}, this.focus)
  }

  renderCustomFields() {
    const { scriptFields } = this.props
    return (
      <div>
        {scriptFields.map((field) => (
          <FlatButton
            labelStyle={styles.scriptFieldButtonLabel}
            style={styles.scriptFieldButton}
            label={delimit(field)}
            labelPosition="before"
            icon={<AddIcon />}
            onTouchTap={() => this.addCustomField(field)}
            mini
          />
        ))}
      </div>
    )
  }

  render() {
    return (
      <div style={styles.root}>
        <div style={styles.editor} onClick={this.focus}>
          <Editor
            editorState={this.state.editorState}
            onChange={this.onChange}
            placeholder="E.g. Hi {firstName}! Using my {customField}"
            ref="editor"
            spellCheck={true}
          />
        </div>
        {this.renderCustomFields()}
      </div>
    );
  }
}
