import React from 'react'
import Popover from 'material-ui/Popover'
// import { insert, update } from '../../api/scripts/methods'
import { List } from 'material-ui/List'
import ScriptList from './ScriptList'

const styles = {
  popover: {
    width: 500
  }
}


class CannedResponseMenu extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      popoverOpen: false
    }
  }

  handleSelectCannedResponse = (cannedResponse) => {
    const { onSelectCannedResponse, onRequestClose } = this.props
    onSelectCannedResponse(cannedResponse.text)
    onRequestClose()
  }

  renderCannedResponses({ scripts, subheader, showAddScriptButton }) {
    const { customFields, campaignId, texterId } = this.props

    return (
      <ScriptList
        texterId={texterId}
        campaignId={campaignId}
        scripts={scripts}
        showAddScriptButton={showAddScriptButton}
        duplicateCampaignResponses
        customFields={customFields}
        subheader={subheader}
        onSelectCannedResponse={this.handleSelectCannedResponse}
      />
    )
  }

  render() {
    const { userCannedResponses, campaignCannedResponses, open, onRequestClose, anchorEl } = this.props

    return (
      <div>
        <Popover
          style={styles.popover}
          open={open}
          anchorEl={anchorEl}
          anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
          targetOrigin={{ horizontal: 'left', vertical: 'bottom' }}
          onRequestClose={onRequestClose}
        >
          <List>
            {this.renderCannedResponses({ scripts: campaignCannedResponses, subheader: 'Suggested', showAddScriptButton: false })}
            {this.renderCannedResponses({ scripts: userCannedResponses, subheader: 'Personal', showAddScriptButton: true })}
          </List>
        </Popover>
      </div>
    )
  }
}

CannedResponseMenu.propTypes = {
  scripts: React.PropTypes.array,
  onSelectCannedResponse: React.PropTypes.function
}

export default CannedResponseMenu
