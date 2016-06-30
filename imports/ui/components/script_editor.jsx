import React, { Component } from 'react'
import {
  EditorState,
  ContentState,
  CompositeDecorator,
  Editor,
  Modifier,
} from 'draft-js'
import { delimit } from '../../api/campaigns/scripts'
import AddIcon from 'material-ui/svg-icons/content/add';
import { red400, green500, grey200 } from 'material-ui/styles/colors'

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
  editor: {
    border: '1px solid #ddd',
    cursor: 'text',
    fontSize: 16,
    padding: 5,
  },
  button: {
    marginTop: 10,
    textAlign: 'center',
  },
  goodField: {
    color: green500,
    direction: 'ltr',
    unicodeBidi: 'bidi-override',
  },
  badField: {
    color: red400
  },
  scriptFieldButton: {
    fontSize: '11px',
    color: green500,
    textTransform: 'none',
    margin: '5px 10px',
    cursor: 'pointer',
    display: 'inline-block',
  },
  scriptFieldButtonIcon: {
    width: 16,
    height: 15,
    marginRight: 0,
    fill: green500,
    verticalAlign: 'middle',
  },
  scriptFieldButtonSection: {
    border: '1px solid #ddd',
    backgroundColor: grey200,
    padding: 5
  }
};


export class ScriptEditor extends React.Component {
  constructor(props) {
    super(props)

    const editorState = this.getEditorState()
    this.state = {
      editorState
    }

    this.focus = () => this.refs.editor.focus()
    this.onChange = this.onChange.bind(this)
    this.addCustomField = this.addCustomField.bind(this)
  }

  getValue() {
    const { editorState } = this.state
    return editorState.getCurrentContent().getPlainText();
  }

  getEditorState() {
    const { scriptFields, scriptText } = this.props

    const decorator = this.getCompositeDecorator(scriptFields)
    let editorState
    if (scriptText) {
      editorState = EditorState.createWithContent(ContentState.createFromText(scriptText), decorator)
    } else {
      editorState = EditorState.createEmpty(decorator)
    }

    return editorState
  }

  onChange(editorState) {
    this.setState( { editorState }, () => {
      const { onChange } = this.props
      if (onChange) {
        console.log("changing script!")
        onChange(this.getValue())
      }
    })
  }

  componentWillReceiveProps() {
    const { scriptFields } = this.props
    const { editorState } = this.state
    const decorator = this.getCompositeDecorator(scriptFields)
    const newEditorState = EditorState.set(editorState, { decorator })

    // this.setState({ editorState: this.getEditorState() })
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
      <div style={styles.scriptFieldButtonSection}>
        {scriptFields.map((field) => (
          <span
            style={styles.scriptFieldButton}
            onTouchTap={() => this.addCustomField(field)}
          >
            <AddIcon style={styles.scriptFieldButtonIcon} />
              {delimit(field)}
          </span>
        ))}
      </div>
    )
  }

  render() {
    const { name} = this.props

    return (
      <div>
        <div style={styles.editor} onClick={this.focus}>
          <Editor
            name={name}
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