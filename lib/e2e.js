const path = require('path')
const { writeFile, unlink } = require('fs')

const JSONDump = require('./grib_dump.js')
const {
  buildURL,
  getLineFromInventory,
  getRangeOffset,
  getInventory,
  getGRIB,
  parseFC,
  euclid
} = require('./helpers.js')

const DEFAULT__DUMPGRIBFILEOPTIONS = {
  resolution: '1p00',


  prefixFilename: '',

  // ... If set to false :
  // xxxxx_2018090300fc036
  // ... If set to true
  // xxxxx_2018090412
  squashForecast: true,


  // Dumps the GRIB file to JSON (using eccodes)
  dumpToJSON: true,


  // Deletes the temporary GRIB file (only if dumpToJSON == true)
  deleteTmpGRBFile: true,


  // Callback to execute once the GRIB file has been downloaded
  afterDownload: () => null,


  // Callback function to execute once the file has been dumped to JSON
  afterDump: () => null,


  logFunction: console.log
}

const absoluteFilename = filename => path.resolve(__dirname, '../downloads', filename)

const validateFC = x => {
  const s = String(x)

  if(s.match(/^\d{1,3}[-,]?\d{0,3}$/))
    return true

  return false
}

/*
  !FIX!
  Just a dirty closure,
  should be rewritten
*/
const dumpGRIBFile = (options, filename, grids, cb=()=>{}, logFunction=console.log) => {
  getInventory(options)
  .then(content => {
    let lines = []

    grids.forEach((x, i) => {
      const line = getLineFromInventory(x, content)

      if (line !== -1)
        lines.push(line)
    })

    logFunction('Retrieved ' + lines.length + ' from the given inventory.')

    if(lines.length > 0){
      const bytes = getRangeOffset(lines, content)

      getGRIB({
        ...options,
        headers: {
          Range: bytes
        }
      })
      .then(res => {
        writeFile(filename + '.grb', res, 'binary', err => {
          if(err) throw err

          cb(filename)
        })
      })
    }
    else{
      logFunction('No grids found with these parameters')
    }
  })
  .catch(err => console.log(err))
}

const e2e = (model, grids, date, forecastRange, options) => {
  if(!model.hasOwnProperty('meta'))
    throw new Error('Invalid model (no meta)')

  const meta = model.meta
  if(!meta.hasOwnProperty('forecast') || !Number.isInteger(meta.forecast))
    throw new Error('Invalid model (no forecast information)')

  if(!validateFC(forecastRange))
    throw new Error('Invalid forecast range')


  const _options = {
    ...DEFAULT__DUMPGRIBFILEOPTIONS,
    ...options
  }

  let fc_handles = []

  if(forecastRange.split('-').length == 2){
    const [fc_from, fc_to] = forecastRange.split('-').map(x => parseInt(x))
    const fc_len = Math.floor((Math.max(fc_from, fc_to) - Math.min(fc_from, fc_to)) / meta.forecast) + 1

    fc_handles = Array.apply(0, Array(fc_len))
                      .map((x, i, ar) => euclid(fc_from + i * meta.forecast, meta.forecast))
  }
  else if(forecastRange.split(',').length == 2)
    fc_handles = forecastRange.split(',').map(x => euclid(parseInt(x), meta.forecast))
  else
    fc_handles = [euclid(forecastRange, meta.forecast)]

  fc_handles.forEach(x => {
    const FC = parseFC(x)
    const displayDate = _options.squashForecast ?
                        date._(x).ymdh()
                        : date.ymdh() + 'fc' + FC
    const _filename = absoluteFilename(_options.prefixFilename + displayDate)

    const reqHeaders = {
      host: model.host,
      path: buildURL(model.path, {
        RESOLUTION: _options.resolution,
        DATE: date.ymd(),
        HOUR: date.h(),
        FC
      })
    }

    _options.logFunction('Fetching ' + date.ymdh() + '+' + FC)

    dumpGRIBFile(reqHeaders, _filename, grids, f => {
      _options.logFunction('Download ' + date.ymdh() + '+' + FC + ' complete!')
      _options.afterDownload(f + '.grb')

      if(_options.dumpToJSON){
        _options.logFunction('... dumping GRIB to JSON')

        JSONDump(f + '.grb')
        .then(content => {
          writeFile(f + '.json', content, 'utf-8', err => {
            if(err)
              throw err

            _options.logFunction('JSON dump complete')
            _options.afterDump(f + '.json')

            if(_options.deleteTmpGRBFile)
              unlink(f + '.grb', errD => {
                if(errD)
                  throw errD

                _options.logFunction('GRIB file deleted.')
              })
          })
        })
      }
    }, _options.logFunction)
  })
}

module.exports = e2e
