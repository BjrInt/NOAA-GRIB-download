const {
  parseUDTable,
  getUDTables,
  getOptionsFromPath,
  buildURL,
  getLineFromInventory,
  getRangeOffset,
  JSON_comma,
  JSON_nest
} = require('./helpers.js')


const __MODEL_GFS = require('./models/GFS.json')
const __MODEL_WAVE = require('./models/WAVE.json')
const UDTABLE = require('./fixtures/UDTable.js')
const INVENTORY = require('./fixtures/inventory.js')
const BROKEN_JSON = require('./fixtures/brokenJSON.js')
const REPAIRED_JSON = require('./fixtures/repairedJSON.js')

describe('GRIB helpers (source integrity)', () => {
  it('NOAA_WAVE has 2 positional arguments', () => {
    const p = __MODEL_WAVE.path

    expect(getOptionsFromPath(p)).toHaveLength(2)
  })

  it('NOAA_GFS has 4 positional arguments', () => {
    const p = __MODEL_GFS.path

    expect(getOptionsFromPath(p)).toHaveLength(4)
  })
})

describe('GRIB helpers (functionnalities)', () => {
  it('Retrieve a line from inventory', () => {
    const l = getLineFromInventory(':WVDIR:surface:', INVENTORY)

    expect(l).toBe(13)
  })

  it('Retrieve a [x0, x1] offset from an inventory', () => {
    const l = getLineFromInventory(':WVDIR:surface:', INVENTORY)
    const offset = getRangeOffset([l], INVENTORY)

    expect(offset).toBe('bytes=365469-400256')
  })

  it('Retrieve a [x0, -> offset from an inventory', () => {
    const offset = getRangeOffset([INVENTORY.length - 1], INVENTORY)

    expect(offset).toBe('bytes=442848-')
  })

  it('URL builder', () => {
    const rawPath = '/a/dummy/path/with%DATE%/and%RESOLUTION%'
    const computedPath = buildURL(rawPath, {DATE: '20180505', RESOLUTION: '1p00'})

    expect(computedPath).toBe('/a/dummy/path/with20180505/and1p00')
  })

  it('URL builder (empty parameter)', () => {
    const rawPath = '/a/dummy/path/with%DATE%'
    const computedPath = buildURL(rawPath, {DATA: '20180505'})

    expect(computedPath).toBe('/a/dummy/path/with')
  })

  it('JSON is "repaired"', () => {
    const repaired = JSON_nest(JSON_comma(BROKEN_JSON))

    expect(JSON.parse(repaired)).toStrictEqual(REPAIRED_JSON)
  })
})
