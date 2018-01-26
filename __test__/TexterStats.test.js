import React from 'react'
import { shallow } from 'enzyme'
import TexterStats from '../src/components/TexterStats'

const campaign = {
  assignments: [
    {
      id: '1',
      texter: {
        id: '1',
        firstName: 'Test',
        lastName: 'Tester'
      },
      unmessagedCount: 193,
      contactsCount: 238
    },
    {
      id: '1',
      texter: {
        id: '1',
        firstName: 'Someone',
        lastName: 'Else',
      },
      unmessagedCount: 4,
      contactsCount: 545
    }
  ]
}

describe('TexterStats', () => {
  it('contains the right text', () => {
    const stats = shallow(<TexterStats campaign={campaign} />)
    expect(stats.text()).toEqual(
      'Test19%<LinearProgress />Someone99%<LinearProgress />'
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
