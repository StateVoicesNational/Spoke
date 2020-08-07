import PropTypes from "prop-types";
import React from "react";
import ReactDOM from "react-dom";
import "emoji-mart/css/emoji-mart.css";
import { Picker } from "emoji-mart";
import IconButton from "material-ui/IconButton";
import EditorInsertEmoticon from "material-ui/svg-icons/editor/insert-emoticon";

class PickerWrapper extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      x: 0,
      y: 0
    };

    this.handleClickOutside = this.handleClickOutside.bind(this);
  }

  componentDidMount() {
    const bounds = ReactDOM.findDOMNode(this.picker).getBoundingClientRect();
    const buttonBounds = ReactDOM.findDOMNode(
      this.props.button
    ).getBoundingClientRect();
    this.setState({
      x: buttonBounds.x - bounds.x - bounds.width,
      y: buttonBounds.y - bounds.y
    });
    document.addEventListener("mousedown", this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener("mousedown", this.handleClickOutside);
  }

  handleClickOutside(event) {
    if (
      this.picker &&
      !ReactDOM.findDOMNode(this.picker).contains(event.target) &&
      !ReactDOM.findDOMNode(this.props.button).contains(event.target)
    ) {
      this.props.onClose();
    }
  }

  render() {
    return (
      <Picker
        selectorVisible={false}
        ref={p => {
          this.picker = p;
        }}
        style={{
          position: "absolute",
          zIndex: "1600",
          left: this.state.x,
          top: this.state.y
        }}
        showSkinTones={true}
        onSelect={this.props.onSelectEmoji}
        defaultSkin={1}
        emoji={""}
        title={""}
      />
    );
  }
}

PickerWrapper.PropTypes = {
  buttonX: PropTypes.number,
  buttonY: PropTypes.number,
  onSelectEmoji: PropTypes.func,
  onClose: PropTypes.func
};

class EmojiPicker extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selectorVisible: false,
      buttonX: 0,
      buttonY: 0
    };
  }

  componentDidMount() {
    const bounds = ReactDOM.findDOMNode(this.button).getBoundingClientRect();
    this.setState({
      buttonX: bounds.x,
      buttonY: bounds.y
    });
  }

  render() {
    return (
      <div>
        {this.state.selectorVisible && (
          <PickerWrapper
            button={this.button}
            onSelectEmoji={emoji => {
              this.setState({ selectorVisible: false });
              this.props.onSelectEmoji(emoji);
            }}
            onClose={() => this.setState({ selectorVisible: false })}
          />
        )}
        <IconButton
          ref={b => {
            this.button = b;
          }}
          size="small"
          onClick={() =>
            this.setState(s => ({ selectorVisible: !s.selectorVisible }))
          }
        >
          <EditorInsertEmoticon />
        </IconButton>
      </div>
    );
  }
}

EmojiPicker.PropTypes = {
  onSelectEmoji: PropTypes.func
};

export default EmojiPicker;
