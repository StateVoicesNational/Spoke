import error from '../../src/client/error-catcher';

describe('error-catcher', () => {
    const mockFn = jest.fn(x => error(x));

    it('returns undefined', () => {
        expect(mockFn()).toBeUndefined();
    })
    
    it('has an argument and still returns undefined', () => {
        expect(mockFn('Forced-error')).toBeUndefined();
    })
})