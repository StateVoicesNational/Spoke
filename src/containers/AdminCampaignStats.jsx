import React from 'react'
import RaisedButton from 'material-ui/RaisedButton'
import Export from './Export'
import Chart from '../components/Chart'
import { Card, CardActions, CardHeader, CardMedia, CardTitle, CardText } from 'material-ui/Card'
import CircularProgress from 'material-ui/CircularProgress'
import TexterStats from '../components/TexterStats'
import { withRouter } from 'react-router'
import { StyleSheet, css } from 'aphrodite'
import loadData from './hoc/load-data'
import gql from 'graphql-tag'
import theme from '../styles/theme'

const inlineStyles = {
  stat: {
    margin: '10px 0',
    width: '100%',
    maxWidth: 400
  },
  count: {
    fontSize: '60px',
    paddingTop: '10px',
    textAlign: 'center',
    fontWeight: 'bold'
  },
  title: {
    textTransform: 'uppercase',
    textAlign: 'center',
    color: 'gray'
  }
}

const styles = StyleSheet.create({
  container: {
    ...theme.layouts.multiColumn.container,
    marginBottom: 40,
    justifyContent: 'space-around',
    flexWrap: 'wrap'
  },
  header: {
    ...theme.text.header
  },
  flexColumn: {
    flex: 1,
    textAlign: 'right',
    display: 'flex'
  },
  question: {
    marginBottom: 24
  },
  rightAlign: {
    marginLeft: 'auto',
    marginRight: 0
  },
  inline: {
    display: 'inline-block',
    marginLeft: 20,
    verticalAlign: 'middle'
  },
  spacer: {
    marginRight: 20
  },
  secondaryHeader: {
    ...theme.text.secondaryHeader
  }
})

const Stat = ({ title, count }) => (
  <Card
    key={title}
    style={inlineStyles.stat}
  >
    <CardTitle
      title={count}
      titleStyle={inlineStyles.count}
    />
    <CardText
      style={inlineStyles.title}
    >
      {title}
    </CardText>
  </Card>
)

Stat.propTypes = {
  title: React.PropTypes.string,
  count: React.PropTypes.number
}

class AdminCampaignStats extends React.Component {
  state = {
    exporting: false
  }

  renderSurveyStats() {
    const { interactionSteps } = this.props.data.campaign

    return interactionSteps.map((step) => {
      if (step.question === '') {
        return <div></div>
      }

      const totalResponseCount = step
        .question
        .answerOptions
        .reduce((prev, answer) => (prev + answer.responderCount), 0)
      return (
        <div key={step.id}>
          <div className={css(styles.secondaryHeader)}>{step.question.text}</div>
          {totalResponseCount > 0 ? (
            <div className={css(styles.container)}>
              <div className={css(styles.flexColumn)}>
                <Stat title='responses' count={totalResponseCount} />
              </div>
              <div className={css(styles.flexColumn)}>
                <div className={css(styles.rightAlign)}>
                  <Chart
                    data={step.question.answerOptions.map((answer) => [answer.value, answer.responderCount])}
                  />
                </div>
              </div>
            </div>
          ) : 'No responses yet'}
        </div>
      )
    })
  }

  renderExport() {
    const button = (
      <RaisedButton
        tooltip='Export a CSV'
        label={this.state.exporting || 'Export Data'}
        disabled={this.state.exporting}
        onTouchTap={() => this.setState({ exporting: 'Preparing data...' })}
      />
    )
    const exporter = (
      <Export
        campaign={this.props.data.campaign}
        onParseStart={() => this.setState({ exporting: 'Creating CSV...' })}
        onDownloadStart={() => this.setState({ exporting: 'Downloading...' })}
        onComplete={() => this.setState({ exporting: false })}
      />
    )
    return (
      <div>
        <div className={css(styles.inline)}>
          {this.state.exporting ? (
            <CircularProgress size={0.4} style={{
              verticalAlign: 'middle',
              display: 'inline-block',
              height: 37,
              width: 37
            }} />) : ''}
        </div>
        <div className={css(styles.inline)}>
          {this.state.exporting ? exporter : ''}
          {button}
        </div>
      </div>
    )
  }

  render() {
    console.log(this.state)
    const { data, params } = this.props
    const { organizationId, campaignId } = params
    const campaign = data.campaign
    return (
      <div>
        <div className={css(styles.container)}>
          <div className={css(styles.header)}>
            {campaign.title}
          </div>
          <div className={css(styles.flexColumn)}>
            <div className={css(styles.rightAlign)}>
              <div className={css(styles.inline)}>
                <div className={css(styles.inline)}>
                  {this.renderExport()}
                </div>
                <div className={css(styles.inline)}>
                  <RaisedButton
                    onTouchTap={() => this.props.router.push(`/admin/${organizationId}/campaigns/${campaignId}/edit`)}
                    label='Edit'
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={css(styles.container)}>
          <div className={css(styles.flexColumn, styles.spacer)}>
            <Stat title='Contacts' count={campaign.contactsCount} />
          </div>
          <div className={css(styles.flexColumn, styles.spacer)}>
            <Stat title='Texters' count={campaign.assignments.length} />
          </div>
          <div className={css(styles.flexColumn, styles.spacer)}>
            <Stat title='Sent' count={campaign.stats.sentMessagesCount} />
          </div>
          <div className={css(styles.flexColumn)}>
            <Stat title='Replies' count={campaign.stats.receivedMessagesCount} />
          </div>
        </div>
        <div className={css(styles.header)}>Survey Questions</div>
        {this.renderSurveyStats()}

        <div className={css(styles.header)}>Texter stats</div>
        <div className={css(styles.secondaryHeader)}>% of first texts sent</div>
        <TexterStats
          campaign={campaign}
        />
      </div>
    )
  }
}

const mapQueriesToProps = ({ ownProps }) => ({
  data: {
    query: gql`query getCampaign($campaignId: String!, $contactFilter: ContactFilter!) {
      campaign(id: $campaignId) {
        id
        title
        assignments {
          id
          texter {
            id
            firstName
            lastName
          }
          unmessagedCount: contactsCount(contactFilter:$contactFilter)
          contactsCount
        }
        interactionSteps {
          id
          question {
            text
            answerOptions {
              value
              responderCount
            }
          }
        }
        contactsCount
        stats {
          sentMessagesCount
          receivedMessagesCount
        }
      }
    }`,
    variables: {
      campaignId: ownProps.params.campaignId,
      contactFilter: {
        messageStatus: 'needsMessage'
      }
    },
    forceFetch: true
  }
})

export default loadData(withRouter(AdminCampaignStats), { mapQueriesToProps })
