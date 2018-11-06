const _D_ = require('./d.js')

describe('Testing date helpers', () => {
  it('Dates are immutable', () => {
    const a = new _D_()
    const b = a._(4)

    expect(b.h()).not.toBe(a.h())
  })

  it('... do the math', () => {
    const d = new _D_('20121212')._(-24)

    expect(d.ymd()).toBe('20121211')
  })

  it('Sets hour correctly', () => {
    const d = new _D_('20121212').set(12)

    expect(d.ymdh()).toBe('2012121212')
  })
})
