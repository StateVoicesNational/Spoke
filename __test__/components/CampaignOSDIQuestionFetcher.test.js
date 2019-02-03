import React from 'react'
import { shallow } from 'enzyme'
import { CampaignOSDIQuestionFetcher } from '../../src/components/CampaignOSDIQuestionFetcher'
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
        organizationId={'42'}
        osdiQuestions={questionObject}
        mapQuestion={() => null}
      />
    )
    const noQuestionsFoundDiv = <div>No questions were found. Please check your OSDI credentials and make sure questions exist in the target system.</div>
    expect(wrapper.containsMatchingElement(noQuestionsFoundDiv)).toBe(true)
  })

  it('renders the correct number of list items when OSDI questions are present', () => {
    const wrapper = shallow(
      <CampaignOSDIQuestionFetcher
        organizationId={'42'}
        osdiQuestions={questionObject}
        mapQuestion={() => null}
      />
    )
    const questionsSelectField = wrapper.find('div SelectField')
    const questionsSelectFieldItems = questionsSelectField.children()
    // The question fetcher prepends a "Select a question..." item to the list,
    // so we expect one more item than there are questions in our fake input.
    expect(questionsSelectFieldItems.length).toBe(4)
  })

  it('triggers the mapQuestion function from its parent component', () => {
    const mockedQuestionMapFn = jest.fn()
    const wrapper = shallow(
      <CampaignOSDIQuestionFetcher
        organizationId={'42'}
        osdiQuestions={questionObject}
        mapQuestion={mockedQuestionMapFn}
      />
    )
    const questionsSelectField = wrapper.find('div SelectField')

    // Simulate selection of the first question in the list
    // (element 0 is the "Select a question..." item). Only the final argument
    // here is actually used by the CampaignOSDIQuestionFetcher.
    questionsSelectField.simulate('change', { target: { value: null } }, 1, 1)

    // Simulate the user clicking "Map" after selecting the question.
    const mapQuestionButton = wrapper.find('div RaisedButton')
    mapQuestionButton.simulate('touchTap')

    // Clicking "Map" should have triggered the mapQuestion mock function.
    expect(mockedQuestionMapFn.mock.calls.length).toEqual(1)

    // We call the mapQuestion prop with a big old object as the only argument,
    // so we destructure twice here to get it out in the open for assertions.
    const [[argument]] = mockedQuestionMapFn.mock.calls

    // Ensure we passed the correct question to mapQuestion.
    expect(argument.questionId).toEqual('https://osdi-sample-system.org/api/v1/questions/a91b4b2e-ae0e-4cd3-9ed7-d0ec501b0baa')
  })
})
