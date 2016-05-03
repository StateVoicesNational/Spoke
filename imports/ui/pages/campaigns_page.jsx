import React, { Component } from 'react'
import Paper from 'material-ui/Paper'
import Dialog from 'material-ui/Dialog';
import { CampaignList } from '../components/campaign_list'
import { CampaignForm } from '../components/campaign_form'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import FlatButton from 'material-ui/FlatButton'
import { insert } from '../../api/campaigns/methods.js';

import ContentAdd from 'material-ui/svg-icons/content/add'

export class CampaignsPage extends Component {
  constructor(props) {
    super(props)
    this.handleSave = this.handleSave.bind(this)
    this.handleCloseDialog = this.handleCloseDialog.bind(this)
    this.handleOpenDialog = this.handleOpenDialog.bind(this)
    this.state = {
      open: false
    }
  }

  handleOpenDialog() {
    console.log("open")
    this.setState({ open: true })
  }
  handleCloseDialog() {
    this.setState({ open: false })
    console.log("close")
  }

  handleSave() {
    console.log("save")
    insert.call(this.refs.form.formData(), (err) => console.log(err));

    this.handleCloseDialog()
  }

  renderDialogActions() {
    return [
      <FlatButton
        label="Cancel"
        onTouchTap={this.handleCloseDialog}
        primary
      />,
      <FlatButton
        label="Save"
        onTouchTap={this.handleSave}
        primary
        keyboardFocused
      />
    ]
  }

  render() {
    const { campaigns } = this.props
    return <Paper>
      <FloatingActionButton mini
        onTouchTap={this.handleOpenDialog}>
        <ContentAdd />
      </FloatingActionButton>
      <Dialog
        actions={this.renderDialogActions()}
        title="Create campaign"
        modal={false}
        open={this.state.open}
        onRequestClose={this.handleSave}
      >
        <CampaignForm ref="form" />
      </Dialog>
      <CampaignList campaigns={campaigns} />
    </Paper>
  }
}
