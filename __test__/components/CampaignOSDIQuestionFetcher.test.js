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
  it('renders the correct number of questions in response to valid OSDI input', () => {
    const fakeQuestionMapFn = jest.fn();
    const questionObject = {
      organization: {
        osdiQuestions: []
      }
    }
    sampleOsdiQuestions.forEach(q => questionObject.organization.osdiQuestions.push(JSON.stringify(q)))
    const wrapper = shallow(
      <CampaignOSDIQuestionFetcher
        organizationId = {'42'}
        osdiQuestions = {questionObject}
        mapQuestion = {fakeQuestionMapFn}
      />
    )
    const questionsSelectField = wrapper.find('div SelectField');
    const questionsSelectFieldItems = questionsSelectField.children();
    // The question fetcher prepends a "Select a question..." item to the list, so we expect one more list items than there are questions in our fake input.
    expect(questionsSelectFieldItems.length).toBe(sampleOsdiQuestions.length + 1);
  })


})
