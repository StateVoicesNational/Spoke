import React, { Component } from 'react'
import {
  EditorState,
  ContentState,
  CompositeDecorator,
  Editor,
  Modifier,
  Entity,
} from 'draft-js'
import {Chip} from './chip'
import IconButton from 'material-ui/IconButton'
import { delimit } from '../../api/campaigns/scripts'

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
};


export class ScriptEditor extends React.Component {
  constructor(props) {
    super(props)

    // const customFields = props.customFields
    const customFields = ['smee', 'tree']


    this.state = {
      editorState: EditorState.createEmpty(this.getCompositeDecorator(customFields)),
    }

    this.focus = () => this.refs.editor.focus()
    this.onChange = (editorState) => this.setState({editorState})
    this.addCustomField = this.addCustomField.bind(this)
  }

  getCompositeDecorator(customFields) {
    const recognizedFieldStrategy = (contentBlock, callback) => {
      const regex = new RegExp(`\{(${customFields.join('|')})\}`, 'g')
      return findWithRegex(regex, contentBlock, callback)
    }

    const unrecognizedFieldStrategy = (contentBlock, callback) =>
    {
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
      },
    ]);
  }

  componentWillReceiveProps() {
    // const customFields = { this.props }
    // const cust
    const customFields = ['smee,', 'tree']
    const { editorState } = this.state
    const decorator = this.getCompositeDecorator(customFields)
    const newEditorState = EditorState.set(editorState, { decorator })

    this.setState( { editorState: newEditorState })
  }

  renderCustomFields() {
    const customFields = ['smee', 'tree']
    return (
      <div>
        {customFields.map((field) => (
          <IconButton
            onTouchTap={() => this.addCustomField(field)}
          >
            <Chip
              text={field}
            />
          </IconButton>
        ))}
      </div>
    )

  }

  addCustomField(field) {
    const textToInsert = delimit(field)
    const { editorState } = this.state
    const selection = editorState.getSelection();
    const contentState = editorState.getCurrentContent();
    const newContentState = Modifier.insertText(contentState, selection, textToInsert);
    const newEditorState = EditorState.push(editorState, newContentState, 'insert-fragment');
    this.setState({ editorState: newEditorState});
    console.log("add field!", field)
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