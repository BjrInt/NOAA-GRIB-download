const grib_dump = require('./grib_dump.js')
const path = require('path')

const referenceDump = require('./fixtures/dump.json')


describe('eccodes is installed', () => {
  it('Testing eccodes dump (GRIB2JSON) ...', () => {
    expect.assertions(1)

    const p = path.resolve(__dirname, 'fixtures/dump.grb')
    return grib_dump(p)
          .then(generatedDump => {
            expect(JSON.parse(generatedDump)).toStrictEqual(referenceDump)
          })
  })
})
