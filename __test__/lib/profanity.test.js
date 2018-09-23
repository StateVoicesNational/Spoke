import { isProfane } from '../../src/lib/profanity'

describe('profanity test', () => {
  it('correctly identifies profanity', () => {
    expect(isProfane('fuck')).toEqual(true)
    expect(isProfane('FUCK')).toEqual(true)
    expect(isProfane('go fuck yourself')).toEqual(true)
    expect(isProfane('fuck you')).toEqual(true)
    expect(isProfane('you fuck')).toEqual(true)
    expect(isProfane('you fucker')).toEqual(true)
    expect(isProfane('fck')).toEqual(false)
  })
})
