
import PropTypes from 'prop-types'
import React, { Component } from 'react'
import _ from 'lodash'
import { StyleSheet, css } from 'aphrodite'

import gql from 'graphql-tag'
import loadData from './hoc/load-data'
import wrapMutations from './hoc/wrap-mutations'
import theme from '../styles/theme'
import CampaignFormSectionHeading from '../components/CampaignFormSectionHeading'
import TextField from 'material-ui/TextField'
import { ListItem, List } from 'material-ui/List'
import RaisedButton from 'material-ui/RaisedButton'
import ErrorIcon from 'material-ui/svg-icons/alert/error'
import { pendingJobsGql } from '../lib/pendingJobsUtils'
import { type } from 'os'

const errorIcon = <ErrorIcon color={theme.colors.red} />

const styles = StyleSheet.create({
  buttonDiv: {
    marginTop: '10px'
  }
})

export class AdminScriptImport extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }
  startImport = async () => {
    const res = await this.props.mutations.importCampaignScript(this.props.campaignData.campaign.id, this.state.url)
    if (res.errors) {
      this.setState({ error: res.errors.message, importingScript: false })
    } else {
      const jobId = res.data.importCampaignScript
      this.setState({ importingScript: true, error: undefined })
      await this.pollDuringActiveJobs(jobId)
    }
  }

  handleUrlChange = (_eventId, newValue) => this.setState({ url: newValue })

  pollDuringActiveJobs = async (jobId) => {
    const fetchedPendingJobsData = await this.props.pendingJobsData.refetch()
    const pendingJobs = fetchedPendingJobsData.data.campaign.pendingJobs
    const ourJob = _.find(pendingJobs, (pendingJob) => pendingJob.id === jobId.toString())
    if (!ourJob || ourJob.resultMessage) {
      this.setState(
        {
          importingScript: false,
          error: !!ourJob && ourJob.resultMessage
        }
      )

      if (!ourJob) {
        this.props.onSubmit()
      }
      return
    }
    setTimeout(async () => {
      await this.pollDuringActiveJobs(jobId)
    }, 1000)
  }

  renderErrors = () => this.state.error && (
    <List>
      <ListItem
        primaryText={this.state.error}
        leftIcon={errorIcon}
      />
    </List>
  )

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
        {this.renderErrors()}
        <div className={css(styles.buttonDiv)}>
          <RaisedButton
            label='Import'
            disabled={this.state.importingScript}
            primary
            onTouchTap={this.startImport}
          />
        </div>
      </div>
    )
  }
}

const mapQueriesToProps = ({ ownProps }) => ({
  pendingJobsData: pendingJobsGql(ownProps.campaignData.campaign.id)
})


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
  onSubmit: type.func,
  campaignData: PropTypes.object,
  mutations: PropTypes.object,
  pendingJobsData: PropTypes.object
}

export default loadData(wrapMutations(AdminScriptImport), {
  mapQueriesToProps,
  mapMutationsToProps
})
