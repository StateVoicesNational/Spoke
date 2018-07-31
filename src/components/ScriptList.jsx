import PropTypes from 'prop-types'
import React from 'react'
import Form from 'react-formal'
import { connect } from 'react-apollo'
import gql from 'graphql-tag'

import Button from '@material-ui/core/Button'
import List from '@material-ui/core/List'
import ListSubheader from '@material-ui/core/ListSubheader'
import ListItem from '@material-ui/core/ListItem'
import Divider from '@material-ui/core/Divider'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import CreateIcon from '@material-ui/icons/Create'

import { log } from '../lib'
import CannedResponseForm from './CannedResponseForm'
import GSSubmitButton from './forms/GSSubmitButton'

const styles = {
  dialog: {
    zIndex: 10001
  }
}

class ScriptList extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      script: props.script,
      dialogOpen: false
    }
  }

  handleOpenDialog = () => {
    this.setState({
      dialogOpen: true
    })
  }

  handleCloseDialog = () => {
    this.setState({
      dialogOpen: false,
      script: null
    })
  }

  render() {
    const {
      subheader,
      scripts,
      onSelectCannedResponse,
      showAddScriptButton,
      customFields,
      campaignId,
      mutations,
      texterId
    } = this.props
    const { dialogOpen } = this.state


    const onSaveCannedResponse = async (cannedResponse) => {
      try {
        const saveObject = {
          ...cannedResponse,
          campaignId,
          userId: texterId
        }
        await mutations.createCannedResponse(saveObject)
        this.setState({ dialogOpen: false })
      } catch (err) {
        log.error(err)
      }
    }

    // const rightIconButton = (
    //   <IconMenu
    //     iconButtonElement={<IconButton><MoreVertIcon /></IconButton>}
    //     anchorOrigin={{horizontal: 'left', vertical: 'bottom'}}
    //     targetOrigin={{horizontal: 'left', vertical: 'bottom'}}
    //   >
    //     <MenuItem primaryText={duplicateCampaignResponses && !script.isUserCreated ? "Duplicate and edit" : "Edit"}
    //       onClick={() => this.handleEditScript(script)}
    //     />
    //     {
    //       script.isUserCreated ? (
    //         <MenuItem primaryText="Delete"
    //           onClick={() => this.handleDeleteScript(script.id)}
    //         />
    //       ) : ''
    //     }
    //   </IconMenu>
    // )

    const rightIconButton = null
    const listItems = scripts.map((script) => (
      <ListItem
        value={script.text}
        onClick={() => onSelectCannedResponse(script)}
        key={script.id}
        primaryText={script.title}
        secondaryText={script.text}
        rightIconButton={rightIconButton}
        secondaryTextLines={2}
      />
    ))


    const list = scripts.length === 0 ? null : (
      <List>
        <ListSubheader>{subheader}</ListSubheader>,
          {listItems}
        <Divider />
      </List>
    )

    return (
      <div>
        {list}
        {showAddScriptButton ? (
          <Button onClick={this.handleOpenDialog}>
            <CreateIcon />
            Add new canned response
          </Button>
        ) : ''}
        <Form.Context>
          <Dialog
            style={styles.dialog}
            open={dialogOpen}
            onRequestClose={this.handleCloseDialog}
          >
            <DialogContent>
              <CannedResponseForm
                onSaveCannedResponse={onSaveCannedResponse}
                customFields={customFields}
                script={this.state.script}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={this.handleCloseDialog}>
                Cancel
              </Button>,
              <Form.Button
                type='submit'
                component={GSSubmitButton}
                label='Save'
              />
            </DialogActions>
          </Dialog>
        </Form.Context>
      </div>
    )
  }
}

ScriptList.propTypes = {
  script: PropTypes.object,
  scripts: PropTypes.arrayOf(PropTypes.object),
  subheader: PropTypes.element,
  onSelectCannedResponse: PropTypes.func,
  showAddScriptButton: PropTypes.bool,
  customFields: PropTypes.array,
  campaignId: PropTypes.number,
  mutations: PropTypes.object,
  texterId: PropTypes.number
}

const mapMutationsToProps = () => ({
  createCannedResponse: (cannedResponse) => ({
    mutation: gql`
      mutation createCannedResponse($cannedResponse: CannedResponseInput!) {
        createCannedResponse(cannedResponse: $cannedResponse) {
          id
        }
      }
    `,
    variables: { cannedResponse }
  })
})

export default connect({
  mapMutationsToProps
})(ScriptList)
