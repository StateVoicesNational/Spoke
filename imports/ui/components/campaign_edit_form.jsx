import React, { Component } from 'react'
import { Messages } from '../../api/messages/messages'
import { Card, CardHeader, CardText } from 'material-ui/Card'
import { CampaignFormSection } from './campaign_form_section'
import { SectionTitles } from './campaign_form'

export class CampaignEditForm extends Component {
  constructor(props) {
    super(props)
    this.onExpandChange = this.onExpandChange.bind(this)
    this.state = {
      expandedSection: null
    }
  }

  onExpandChange(title, newExpandedState) {
    const { expandedSection } = this.state
    if (newExpandedState) {
      this.setState({ expandedSection: title })
    } else if (title === expandedSection) {
      this.setState({ expandedSection: null })
    }
  }

  render() {
    const {
      campaign,
      sections,
      onSubmitSurveys,
      onSubmitContacts,
      onSubmitBasics,
      onSubmitTexters,
      onSubmitScripts
    } = this.props

    const { expandedSection } = this.state
    const hasMessage = Messages.findOne({ campaignId: campaign._id })

    const submitAction = (sectionTitle) => {
      let action
      if (sectionTitle === SectionTitles.contacts) {
        action = onSubmitContacts
      } else if (sectionTitle === SectionTitles.surveys) {
        action = onSubmitSurveys
      } else if (sectionTitle === SectionTitles.basics) {
        action = onSubmitBasics
      } else if (sectionTitle === SectionTitles.texters) {
        action = onSubmitTexters
      } else if (sectionTitle === SectionTitles.scripts) {
        action = onSubmitScripts
      }
      return action
    }

    // TODO
    const alwaysEditable = false
    return (
      <div>
        { sections.map(({ title, content }) => (
          <Card
            key={title}
            expanded={title === expandedSection}
            onExpandChange={(newExpandedState) => this.onExpandChange(title, newExpandedState)}
          >
            <CardHeader
              title={title}
              actAsExpander
              showExpandableButton
            />
            <CardText expandable>
              {alwaysEditable || !hasMessage ? (
                <CampaignFormSection
                  showPreviousStep={false}
                  content={content()}
                  onNext={submitAction(title)}
                  nextStepLabel="Save"
                />
              ) : "This campaign has already begun so you can't edit this section."}
            </CardText>
          </Card>
        ))}
    </div>
    )
  }
}

CampaignEditForm.propTypes = {
  sections: React.PropTypes.array,
  campaign: React.PropTypes.object,
  onSubmitSurveys: React.PropTypes.func,
  onSubmitContacts: React.PropTypes.func,
  onSubmitCampaignEdit: React.PropTypes.func
}
