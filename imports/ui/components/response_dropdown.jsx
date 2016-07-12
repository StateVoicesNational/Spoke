import React, { Component } from 'react'
import Popover from 'material-ui/Popover'
import { insert, update, remove } from '../../api/scripts/methods'
import { List } from 'material-ui/List'
import { ScriptList } from './script_list'
import CreateIcon from 'material-ui/svg-icons/content/create'

const styles = {
  popover: {
    width: 500,
  },
}


export class ResponseDropdown extends Component {
  constructor(props) {
    super(props)
    this.handleSelectScript = this.handleSelectScript.bind(this)
    // this.handleOpenDialog = this.handleOpenDialog.bind(this)
    // this.handleCloseDialog = this.handleCloseDialog.bind(this)
    // this.handleEditScript = this.handleEditScript.bind(this)
    this.submit = this.submit.bind(this)
    this.state = {
      dialogOpen: false,
      popoverOpen: false,
    }
  }

  submit(script, model) {
    const { campaignId, onScriptChange } = this.props

    const callback = (err) => {
      if (err) {
        alert(err)
      } else {
        this.handleCloseDialog()
        onScriptChange(model.text)
      }
    }

    if (script && script._id) {
      update.call(_.extend(model, { scriptId: script._id }), callback)
    } else {
      insert.call(_.extend(model, { campaignId }), callback)
    }
  }

  handleSelectScript(script) {
    console.log("handel touch top")
    const { onScriptChange, onRequestClose } = this.props
    onScriptChange(script.text)
    onRequestClose()
  }

  renderScripts(scripts, subheader) {
    return (
      <ScriptList
        scripts={scripts}
        subheader={subheader}
        onItemTouchTap={this.handleSelectScript}
        onSaveScript={this.submit}
      />
    )
  }

  render() {
    const { userResponses, campaignResponses, open, onRequestClose, anchorEl } = this.props
    const { dialogOpen } = this.state
    return (
      <div>
        <Popover
          style={styles.popover}
          open={open}
          anchorEl={anchorEl}
          anchorOrigin={{horizontal: 'left', vertical: 'bottom'}}
          targetOrigin={{horizontal: 'left', vertical: 'bottom'}}
          onRequestClose={onRequestClose}
        >
          <List>
            {this.renderScripts(campaignResponses, 'Suggested')}
            {this.renderScripts(userResponses, 'Personal')}
          </List>
        </Popover>
      </div>
    )
  }
}

ResponseDropdown.propTypes = {
  scripts: React.PropTypes.array,
  onScriptChange: React.PropTypes.function
}