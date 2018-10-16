import React from 'react'
import { shallow } from 'enzyme'
import TexterStats from '../src/components/TexterStats'

const campaign = {
  useDynamicAssignment: false,
  textersInflight: [],
  assignments: [
    {
      id: '2',
      texter: {
        id: '1',
        firstName: 'Test',
        lastName: 'Tester'
      },
      unmessagedCount: 193,
      contactsCount: 238
    },
    {
      id: '3',
      texter: {
        id: '2',
        firstName: 'Someone',
        lastName: 'Else',
      },
      unmessagedCount: 4,
      contactsCount: 545
    }
  ]
}

const campaignDynamic = {
  useDynamicAssignment: true,
  assignments: [
    {
      id: '2',
      texter: {
        id: '1',
        firstName: 'Test',
        lastName: 'Tester'
      },
      unmessagedCount: 193,
      contactsCount: 238
    },
    {
      id: '3',
      texter: {
        id: '2',
        firstName: 'Someone',
        lastName: 'Else',
      },
      unmessagedCount: 4,
      contactsCount: 545
    }
  ],
  textersInflight: [{ id: '1', inflightCount: 5, lastMessageTime: new Date() }]
}


describe('TexterStats (Non-dynamic campaign)', () => {
  it('contains the right text', () => {
    const stats = shallow(<TexterStats campaign={campaign} />)
    expect(stats.text()).toEqual(
      'Test Tester19%<LinearProgress />Someone Else99%<LinearProgress />'
    )
  })

  it('creates linear progress correctly', () => {
    const linearProgress = shallow(<TexterStats campaign={campaign} />).find(
      'LinearProgress'
    )
    expect(linearProgress.length).toBe(2)
    expect(linearProgress.first().props()).toEqual({
      max: 100,
      min: 0,
      mode: 'determinate',
      value: 19
    })
  })
})


describe('TexterStats (Dynamic campaign)', () => {
  it('contains the right text', () => {
    const stats = shallow(<TexterStats campaign={campaignDynamic} />)
    expect(stats.text()).toEqual(
      'Test45 initial messages sent (5 in-flight a few seconds ago)Someone541 initial messages sent'
    )
  })
})
