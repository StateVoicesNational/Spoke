
import PropTypes from 'prop-types'
import React, { Component } from 'react'
import _ from 'lodash'
import { StyleSheet, css } from 'aphrodite'

import gql from 'graphql-tag'
import loadData from './hoc/load-data'
import wrapMutations from './hoc/wrap-mutations'
import CampaignFormSectionHeading from '../components/CampaignFormSectionHeading'
import TextField from 'material-ui/TextField'
import RaisedButton from 'material-ui/RaisedButton'

const styles = StyleSheet.create({
  buttonDiv: {
    marginTop: '10px'
  }
})

export class AdminScriptImport extends Component {
  constructor(props) {
    super(props)

    console.log(props)

    this.state = {
    }
  }

  startImport = async () => {
    const res = await this.props.mutations.importCampaignScript(this.props.campaignData.campaign.id, this.state.url)
    if (res.errors) {

    } else {
      const jobId = res.data.importCampaignScript
      this.setState({ jobId })
      console.log(jobId)
    }
  }

  handleUrlChange = (_eventId, newValue) => this.setState({ url: newValue })

  render() {
    return (
      <div>
        <CampaignFormSectionHeading
          title='Script Import'
          subtitle='You can import interactions and canned responses from a properly formatted Google Doc.'
        />
        <TextField
          hintText='URL of the Google Doc'
          floatingLabelText='Google Doc URL'
          style={{ width: '100%' }}
          onChange={this.handleUrlChange}
        />
        <div className={css(styles.buttonDiv)}>
        <RaisedButton
          label='Import'
          primary
          onTouchTap={this.startImport}
        />
        </div>
      </div>
    )
  }
}

const mapMutationsToProps = () => ({
  importCampaignScript: (campaignId, url) => ({
    mutation: gql`
      mutation importCampaignScript($campaignId: String!, $url: String!) {
        importCampaignScript(campaignId: $campaignId, url: $url) 
      },
    `,
    variables: {
      campaignId,
      url
    }
  })
})

AdminScriptImport.propTypes = {
  campaignData: PropTypes.object,
  mutations: PropTypes.object
}

export default loadData(wrapMutations(AdminScriptImport), {
  mapMutationsToProps
})
