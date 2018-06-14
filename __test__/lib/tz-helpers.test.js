import {getProcessEnvDstReferenceTimezone} from "../../src/lib/tz-helpers";

jest.unmock('../../src/lib/tz-helpers')

describe('test getProcessEnvDstReferenceTimezone', () => {
  it('works', () => {
    expect(getProcessEnvDstReferenceTimezone()).toEqual('America/New_York')
  })
})

