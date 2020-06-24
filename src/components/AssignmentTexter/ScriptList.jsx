import PropTypes from "prop-types";
import React from "react";
import FlatButton from "material-ui/FlatButton";
import { List, ListItem } from "material-ui/List";
// import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert'
import CreateIcon from "material-ui/svg-icons/content/create";
import ClearIcon from "material-ui/svg-icons/content/clear";
// import IconButton from 'material-ui/IconButton'
// import IconMenu from 'material-ui/IconMenu'
// import MenuItem from 'material-ui/MenuItem'
import Subheader from "material-ui/Subheader";
import Divider from "material-ui/Divider";
import Dialog from "material-ui/Dialog";
import CannedResponseForm from "../CannedResponseForm";
import GSSubmitButton from "../forms/GSSubmitButton";
import Form from "react-formal";
import { log } from "../../lib";

// import { insert, update, remove } from '../../api/scripts/methods'

const styles = {
  dialog: {
    zIndex: 10001
  }
};

class ScriptList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dialogOpen: false
    };
  }

  handleOpenDialog = () => {
    this.setState({
      dialogOpen: true
    });
    // hack so mobile onclick doesn't close immediately
    setTimeout(() => {
      this.setState({ dialogReady: true });
    }, 200);
  };

  handleCloseDialog = () => {
    if (this.state.dialogReady) {
      this.setState({
        dialogOpen: false,
        dialogReady: false
      });
    }
  };

  render() {
    const {
      subheader,
      scripts,
      onSelectCannedResponse,
      onCreateCannedResponse,
      showAddScriptButton,
      currentCannedResponseScript,
      customFields
    } = this.props;
    const { dialogOpen } = this.state;

    const onSaveCannedResponse = async cannedResponse => {
      this.setState({ dialogOpen: false });
      try {
        await onCreateCannedResponse({ cannedResponse });
      } catch (err) {
        log.error(err);
      }
    };

    const rightIconButton = null;
    const listItems = scripts.map(script => (
      <ListItem
        value={script.text}
        onClick={() => onSelectCannedResponse(script)}
        onKeyPress={evt => {
          if (evt.key === "Enter") {
            onSelectCannedResponse(script);
          }
        }}
        key={script.id}
        primaryText={script.title}
        secondaryText={script.text}
        rightIconButton={
          currentCannedResponseScript &&
          currentCannedResponseScript.id === script.id ? (
            <ClearIcon />
          ) : null
        }
        secondaryTextLines={2}
      />
    ));

    const list =
      scripts.length === 0 ? null : (
        <List>
          <Subheader>{subheader}</Subheader>
          {listItems}
          <Divider />
        </List>
      );

    return (
      <div>
        {list}
        {showAddScriptButton ? (
          <FlatButton
            label="Add new canned response"
            icon={<CreateIcon />}
            onTouchTap={this.handleOpenDialog}
          />
        ) : (
          ""
        )}
        <Form.Context>
          <Dialog
            style={styles.dialog}
            open={dialogOpen}
            actions={[
              <FlatButton label="Cancel" onTouchTap={this.handleCloseDialog} />,
              <Form.Button
                type="submit"
                component={GSSubmitButton}
                label="Save"
              />
            ]}
            onRequestClose={this.handleCloseDialog}
          >
            <CannedResponseForm
              onSaveCannedResponse={onSaveCannedResponse}
              customFields={customFields}
            />
          </Dialog>
        </Form.Context>
      </div>
    );
  }
}

ScriptList.propTypes = {
  script: PropTypes.object,
  scripts: PropTypes.arrayOf(PropTypes.object),
  subheader: PropTypes.element,
  currentCannedResponseScript: PropTypes.object,
  onSelectCannedResponse: PropTypes.func,
  onCreateCannedResponse: PropTypes.func,
  showAddScriptButton: PropTypes.bool,
  customFields: PropTypes.array
};

export default ScriptList;
