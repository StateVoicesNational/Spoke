import React from 'react'
import {shallow} from 'enzyme'
import {CampaignOSDIQuestionFetcher} from '../../src/components/CampaignOSDIQuestionFetcher'
import sampleOsdiQuestions from '../test_data/sample_osdi_questions.json'

// CampaignOSDIQuestionFetcher.propTypes = {
//   organizationId: PropTypes.string.isRequired,
//   osdiQuestions: PropTypes.object.isRequired,
//   mapQuestion: PropTypes.func.isRequired
// }

describe('The OSDI question fetcher component', () => {
  let questionObject
  beforeEach(() => {
    // Set up the question object to be passed to
    // <CampaignOSDIQuestionFetcher /> as a prop.
    questionObject = {
      organization: {
        // Annoyingly, because of the way our GraphQL API is set up, this
        // component expects an array stringified JSON objects representing the
        // questions.
        osdiQuestions: sampleOsdiQuestions.map(JSON.stringify)
      }
    }
  })
  
  it('renders correctly when no OSDI questions are present', () => {
    // Set the question object to have no questions
    questionObject.organization.osdiQuestions = []

    // We're not interested in the behavior of the mapQuestion function at this
    // point, so we won't bother mocking it. It will be tested later.
    const wrapper = shallow(
      <CampaignOSDIQuestionFetcher
        organizationId = {'42'}
        osdiQuestions = {questionObject}
        mapQuestion = {() => null}
      />
    )
    const noQuestionsFoundDiv = <div>No questions were found. Please check your OSDI credentials and make sure questions exist in the target system.</div>
    expect(wrapper.containsMatchingElement(noQuestionsFoundDiv)).toBe(true)
  })

  it('renders the correct number of list items when OSDI questions are present', () => {
    const wrapper = shallow(
      <CampaignOSDIQuestionFetcher
        organizationId = {'42'}
        osdiQuestions = {questionObject}
        mapQuestion = {() => null}
      />
    )
    const questionsSelectField = wrapper.find('div SelectField');
    const questionsSelectFieldItems = questionsSelectField.children();
    // The question fetcher prepends a "Select a question..." item to the list,
    // so we expect one more item than there are questions in our fake input.
    expect(questionsSelectFieldItems.length).toBe(4);
  })
})
