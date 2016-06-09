import React, { Component } from 'react'
import RaisedButton from 'material-ui/RaisedButton'
import FlatButton from 'material-ui/FlatButton'

const styles = {
  navigation: {
    marginTop: 48,
  },
  backButton: {
    marginRight: 10
  }
}

export class CampaignFormSection extends Component {
  constructor(props) {
    super(props)
    this.state = {
      nextStepEnabled: false
    }
  }

  enableNext() {
    this.setState({
      nextStepEnabled: true
    })
  }

  disableNext() {
    this.setState({
      nextStepEnabled: false
    })
  }

  render() {
    const { onNext, onPrevious, content, previousStepEnabled, nextStepLabel} = this.props
    const { nextStepEnabled } = this.state
    return (
      <div>
        { React.cloneElement(content, {
          onValid: this.enableNext.bind(this),
          onInvalid: this.disableNext.bind(this)
        }) }
        <div style={styles.navigation}>
          <FlatButton
            style={styles.backButton}
            label="Back"
            disabled={!previousStepEnabled}
            onTouchTap={onPrevious}
          />
          <RaisedButton
            primary
            label={nextStepLabel}
            disabled={!nextStepEnabled}
            onTouchTap={onNext}
          />
        </div>
      </div>
    )
  }
}
