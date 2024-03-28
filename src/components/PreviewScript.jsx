import PropTypes from "prop-types";
import React from "react";
import { compose } from "recompose";

import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import IconButton from "@material-ui/core/IconButton";

import Card from "@material-ui/core/Card";
import CardHeader from "@material-ui/core/CardHeader";
import Collapse from "@material-ui/core/Collapse";

import { dataTest } from "../lib/attributes";
import { applyScript } from "../lib/scripts";

import withMuiTheme from "../containers/hoc/withMuiTheme";

class PreviewScript extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      expanded: false,
    };
    this.styles = {
        messageList: {
            width: 510,
            padding: 8,
            minHeight: 110,
        },
        msgBubble: {
          textAlign: "left",
          marginLeft: "20%",
          marginRight: 10,
          borderRadius: 16,
          marginBottom: 10, 
          fontSize: "95%",
          width: "auto",
          maxWidth: 500,
          padding: 16
        },
        msgContainer: {
            marginTop: 6,
            marginBottom: 6,
        },
        msgText: {
            fontWeight: 400,
            lineHeight: 1.5,
            fontSize: "1rem",
            whiteSpace: "pre-line",
        },
        msgDelivery: {
            fontSize: "90%",
            paddingTop: 5,
            color: "rgba(0, 0, 0, 0.54)",
        }
    };
  }

  renderMsg(text) {
    return (
      <div style={this.styles.msgContainer}>
        <div style={this.styles.msgText}>
          {text}
        </div>
        <div style={this.styles.msgDelivery}>
          A few seconds ago
        </div>
      </div>
    );
  }

  renderSentMsg(text) {
    return (
      <div style={{ ...this.styles.msgBubble, marginLeft: "20%", marginRight: 10, color: this.props.muiTheme.palette.text.primary, backgroundColor: this.props.muiTheme.palette.background.default }}>
        {this.renderMsg(text)}
      </div>
    );
  }

  renderReceivedMsg(text) {
    return (
      <div style={{ ...this.styles.msgBubble, marginRight: "20%", marginLeft: 10,  color: this.props.muiTheme.palette.common.white, backgroundColor: this.props.muiTheme.palette.info.main }}>
        {this.renderMsg(text)}
      </div>
    );
  }

  render() {
    const cardHeaderStyle = {
        fontSize: 20
      };
    if (!this.props.contacts || this.props.contacts.length < 1) {
        return null;
    }
    const scriptPreview = applyScript({
        texter: this.props.texters[0],
        contact: this.props.contacts[0],
        script: this.props.interactionStep.script,
        customFields: this.props.customFields
     });

        return (
          <Card
            {...dataTest("previewScript")}
            key="previewScript"
            style={{ marginTop: 1, backgroundColor: "rgb(240, 240, 240)" }}
          >
            <CardHeader
              title="Preview"
              action={
              (
                <IconButton>
                  <ExpandMoreIcon />
                </IconButton>
              )
            }
              disableTypography
              style={cardHeaderStyle}
              onClick={newExpandedState => {
                  this.setState(prevState => {
                    prevState.expanded = !prevState.expanded
                    return prevState
                  });
              }}
            />
            <Collapse
              in={this.state.expanded}
              timeout="auto"
              unmountOnExit
              style={{
                margin: "20px"
              }}
            >  
              <div style={this.styles.messageList}>
                {this.props.interactionStep.parentInteractionId ? 
                    this.renderReceivedMsg(this.props.interactionStep.answerOption)
                : null}
                {this.renderSentMsg(scriptPreview)}
              </div>
            </Collapse>
          </Card>
        );
    }
}

PreviewScript.propTypes = {
  interactionStep: PropTypes.object,
  texters: PropTypes.array,
  contacts: PropTypes.array,
  customFields: PropTypes.array,
};

export default compose(withMuiTheme)(PreviewScript);
