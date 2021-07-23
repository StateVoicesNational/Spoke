import PropTypes from "prop-types";
import React from "react";
import { Link } from "react-router";
import {
  EditorState,
  ContentState,
  CompositeDecorator,
  Editor,
  Modifier
} from "draft-js";
import { delimit } from "../lib/scripts";
import Chip from "./Chip";
import { red400, green500, green600, grey100 } from "material-ui/styles/colors";
import { getCharCount } from "@trt2/gsm-charset-utils";

const styles = {
  editor: {
    border: "1px solid #ddd",
    cursor: "text",
    fontSize: 16,
    padding: 5
  },
  button: {
    marginTop: 10,
    textAlign: "center"
  },
  goodField: {
    color: green500,
    direction: "ltr",
    unicodeBidi: "bidi-override"
  },
  badField: {
    color: red400
  },
  scriptFieldButton: {
    fontSize: "11px",
    color: green600,
    textTransform: "none",
    backgroundColor: grey100,
    // margin: '5px 10px',
    cursor: "pointer"
    // display: 'inline-block',
  },
  scriptFieldButtonSection: {
    marginTop: 10,
    padding: 5
  }
};

const gsmReplacements = [
  ["‘", "'"],
  ["’", "'"],
  ["”", '"'],
  ["”", '"'],
  ["“", '"'],
  ["–", "-"]
];

const replaceEasyGsmWins = text =>
  gsmReplacements.reduce(
    (acc, replacement) => acc.replace(replacement[0], replacement[1]),
    text
  );

function findWithRegex(regex, contentBlock, callback) {
  const text = contentBlock.getText();
  let matchArr = regex.exec(text);
  let start;
  while (matchArr !== null) {
    start = matchArr.index;
    callback(start, start + matchArr[0].length);
    matchArr = regex.exec(text);
  }
}

const RecognizedField = props => (
  <span {...props} style={styles.goodField}>
    {props.children}
  </span>
);

RecognizedField.propTypes = {
  children: PropTypes.arrayOf(PropTypes.element)
};

const UnrecognizedField = props => (
  <span {...props} style={styles.badField}>
    {props.children}
  </span>
);

UnrecognizedField.propTypes = {
  children: PropTypes.arrayOf(PropTypes.element)
};

class ScriptEditor extends React.Component {
  constructor(props) {
    super(props);

    const editorState = this.getEditorState();
    this.state = {
      editorState,
      readyToAdd: false
    };

    this.focus = () => this.refs.editor.focus();
    this.onChange = this.onChange.bind(this);
    this.addCustomField = this.addCustomField.bind(this);
    // start out with buttons disabled for 200ms
    // because sometimes the click to open lands
    // on one of the items.  After it opens, we enable them.
    setTimeout(() => {
      this.setState({ readyToAdd: true });
    }, 200);
  }

  componentWillReceiveProps() {
    const { scriptFields } = this.props;
    const { editorState } = this.state;
    const decorator = this.getCompositeDecorator(scriptFields);
    EditorState.set(editorState, { decorator });
    // this.setState({ editorState: this.getEditorState() })
  }

  onChange(editorState) {
    this.setState({ editorState }, () => {
      const { onChange } = this.props;
      if (onChange) {
        onChange(this.getValue());
      }
    });
  }

  getEditorState() {
    const { scriptFields, scriptText } = this.props;

    const decorator = this.getCompositeDecorator(scriptFields);
    let editorState;
    if (scriptText) {
      editorState = EditorState.createWithContent(
        ContentState.createFromText(scriptText),
        decorator
      );
    } else {
      editorState = EditorState.createEmpty(decorator);
    }

    return editorState;
  }

  getValue() {
    const { editorState } = this.state;
    return editorState.getCurrentContent().getPlainText();
  }

  getCompositeDecorator(scriptFields) {
    const recognizedFieldStrategy = (contentBlock, callback) => {
      const regex = new RegExp(`\{(${scriptFields.join("|")})\}`, "g");
      return findWithRegex(regex, contentBlock, callback);
    };

    const unrecognizedFieldStrategy = (contentBlock, callback) =>
      findWithRegex(/\{[^{]*\}/g, contentBlock, callback);

    return new CompositeDecorator([
      {
        strategy: recognizedFieldStrategy,
        component: RecognizedField
      },
      {
        strategy: unrecognizedFieldStrategy,
        component: UnrecognizedField
      }
    ]);
  }

  addCustomField(field) {
    const { editorState, readyToAdd } = this.state;
    if (!readyToAdd) {
      return;
    }
    const textToInsert = delimit(field);
    const selection = editorState.getSelection();
    const contentState = editorState.getCurrentContent();
    const newContentState = Modifier.insertText(
      contentState,
      selection,
      textToInsert
    );
    const newEditorState = EditorState.push(
      editorState,
      newContentState,
      "insert-fragment"
    );
    this.setState({ editorState: newEditorState }, this.focus);
  }

  renderCustomFields() {
    const { scriptFields } = this.props;
    return (
      <div style={styles.scriptFieldButtonSection}>
        {scriptFields.map(field => (
          <Chip
            style={styles.scriptFieldButton}
            text={delimit(field)}
            onTouchTap={() => this.addCustomField(field)}
          />
        ))}
      </div>
    );
  }

  render() {
    const { name } = this.props;
    const text = this.state.editorState.getCurrentContent().getPlainText();
    const segmentInfo = getCharCount(replaceEasyGsmWins(text));
    return (
      <div>
        <div style={segmentInfo.charCount > 1600 ? { color: "red" } : {}}>
          Total characters: {segmentInfo.charCount}
          {segmentInfo.charCount > 1600 ? (
            <span> Exceeded MMS maximum </span>
          ) : null}
        </div>
        <div style={styles.editor} onClick={this.focus}>
          <Editor
            name={name}
            editorState={this.state.editorState}
            onChange={this.onChange}
            ref="editor"
            spellCheck
          />
        </div>
        {this.renderCustomFields()}
        <div>
          Estimated{" "}
          <Link
            target="_blank"
            to="https://www.twilio.com/blog/2017/03/what-the-heck-is-a-segment.html"
          >
            Segments
          </Link>
          : {segmentInfo.msgCount}
          <br />
          Characters left in current segment:{" "}
          {segmentInfo.msgCount * segmentInfo.charsPerSegment -
            segmentInfo.charCount}
          <br />
        </div>
      </div>
    );
  }
}

ScriptEditor.propTypes = {
  scriptFields: PropTypes.array,
  scriptText: PropTypes.string,
  onChange: PropTypes.func,
  name: PropTypes.string
};

export default ScriptEditor;
