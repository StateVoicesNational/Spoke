import React, { Component } from 'react'
import DropDownMenu from 'material-ui/DropDownMenu'
import MenuItem from 'material-ui/MenuItem'
import Divider from 'material-ui/Divider'
import Dialog from 'material-ui/Dialog'
import FlatButton from 'material-ui/FlatButton'
import RaisedButton from 'material-ui/RaisedButton'
import Subheader from 'material-ui/Subheader';
import CreateIcon from 'material-ui/svg-icons/content/add'
import {CannedResponseForm} from './canned_response_form'
import { insert } from '../../api/scripts/methods'

export class ResponseDropdown extends Component {
  constructor(props) {
    super(props)
    this.handleChange = this.handleChange.bind(this)
    this.handleOpenDialog = this.handleOpenDialog.bind(this)
    this.handleCloseDialog = this.handleCloseDialog.bind(this)
    this.submit = this.submit.bind(this)
    this.state = {
      open: false
    }
  }

  handleOpenDialog() {
    this.setState({
      open: true
    })
  }

  handleCloseDialog() {
    this.setState({
      open: false
    })
  }

  handleChange(event, index, value) {
    console.log(event, index, value)
    const { onScriptChange } = this.props
    onScriptChange(value)
  }

  submit() {
    const { campaignId, onScriptChange } = this.props
    const model = this.refs.form.getModel()
    const data = _.extend(model, { campaignId })

    insert.call(data, (err) => {
      if (err) {
        alert(err)
      } else {
        this.handleCloseDialog()
        onScriptChange(model.text)
      }
    })
    // CREATE NEW SAVED REPLY
  }

  render() {
    const { userResponses, campaignResponses } = this.props
    const { open } = this.state
    return (
      <div>
        <DropDownMenu value={1} onChange={this.handleChange}>
          <MenuItem value={1} primaryText='Saved responses' disabled />
          { campaignResponses.map((response) =>
            <MenuItem value={response.text}
              primaryText={response.title}
            />) }
          <Divider />
          <Subheader>Your responses</Subheader>
          { userResponses.map((response) =>
            <MenuItem value={response.text}
              primaryText={response.title}
            />) }
          <Divider />
          <MenuItem
            primaryText="Create new"
            leftIcon={ <CreateIcon />}
            onTouchTap={this.handleOpenDialog}
          />
        </DropDownMenu>
          <Dialog
            open={open}
            actions={[
              <FlatButton
                label="Cancel"
                onTouchTap={this.handleCloseDialog}
              />,
              <RaisedButton
                label="Save"
                type="submit"
                disabled={!this.state.doneButtonEnabled}
                onTouchTap={this.submit}
                primary
              />
            ]}
            onRequestClose={this.handleCloseDialog}
          >
            <CannedResponseForm
              ref="form"
              onValid={() => this.setState( { doneButtonEnabled: true })}
              onInvalid={() => this.setState( { doneButtonEnabled: false })}
            />
          </Dialog>
      </div>
    )
  }
}

ResponseDropdown.propTypes = {
  responses: React.PropTypes.array,
  onScriptChange: React.PropTypes.function
}