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

  submit(script, model, callback) {
    const { campaignId, onScriptChange } = this.props

    const newCallback = (err) => {
      if (err) {
        alert(err)
      } else {
        onScriptChange(model.text)
        callback()
      }
    }

    if (script && script._id) {
      update.call(_.extend(model, { scriptId: script._id }), newCallback)
    } else {
      insert.call(_.extend(model, { campaignId }), newCallback)
    }
  }

  handleSelectScript(script) {
    console.log("handel touch top", script)
    const { onScriptChange, onRequestClose } = this.props
    onScriptChange(script.text)
    onRequestClose()
  }

  renderScripts({ scripts, subheader, showAddScriptButton }) {
    return (
      <ScriptList
        scripts={scripts}
        showAddScriptButton={showAddScriptButton}
        duplicateCampaignResponses
        subheader={subheader}
        onSelectScript={this.handleSelectScript}
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
            {this.renderScripts({scripts: campaignResponses, subheader: 'Suggested', showAddScriptButton: false})}
            {this.renderScripts({scripts: userResponses, subheader: 'Personal', showAddScriptButton: true})}
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