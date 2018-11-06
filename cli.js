const HELP_MSG = `===================================================================
  node cli.js download [... options]
  Downloads the given set of grids
    | -d [arg] : Date of model run
    |  * YYYYMMDD[hh] format (hh is optional) [default: most recent run]

    | -f [arg] : forecast range
    |  * x,y -> x AND y hours ahead
    |  * x-y -> x TO y hours ahead
    |  * x -> x hours ahead (single grid) [default: 0]
       eg: [...] -f 6-18 will download every possible forecast for the next 6 to 18 hours

    | -g [arg] : grids to download
    |  * wind : U, V-component of wind [DEFAULT]
    |  * temp : avg temp (GFS only)
    |  * pres : Pressure & geopot. height (GFS only)
    |  * snow : Snow&Ice grids (GFS only)
    |  * wave : Swell waves (WAVE only)

    | -j : dumps to JSON (using eccodes)
    | -x : deletes the .grb file (useful if you only need the JSON file)

    | -q : Quiet mode (no console output)

    | -r [arg] : resolution (degrees per point)
    |  * 1 [DEFAULT]
    |  * .5
    |  * .25

    | -s [arg] : source (case insensitive)
    |  * gfs (NOAA GFS) [DEFAULT]
    |  * wave (NOAA WAVE)


  node cli.js get-inventory [-f -i -r -s]
  Dumps the most recent inventory for the given source
    | -i [arg] : matches species slug with the given user defined table (case insensitive)
    |  * ncep
    |  * ecmwf128
    |  * ecmwf160


  node cli.js get-udt [ud_table]
  Dumps every user defined tables (uses console.table), if a third argument is given only displays this
    |  * ncep
    |  * ecmwf128
    |  * ecmwf160
===================================================================`




const {
  getUDTables,
  getModels,
  buildURL,
  getInventory,
  getClosestModelRun,
} = require('./lib/helpers.js')
const e2e = require('./lib/e2e.js')
const _D_ = require('./lib/d.js')

const filteredUDT = (f=null) => {
  const UDT = getUDTables()

  if(f != undefined)
    return Object.entries(UDT)
           .filter(x => x[0] === String(f).toUpperCase())

  return Object.entries(UDT)
}

const getArg = (x, args) => {
  const pos = args.indexOf(x)

  if(pos !== -1)
    return _args[pos + 1]

  return null
}

const DEFAULT_GRIDS = {
  'wind': [
    // GFS
    'UGRD:10 m',
    'VGRD:10 m',

    // WAVE
    'UGRD:surface',
    'VGRD:surface',
  ],

  // GFS ONLY
  'temp': [
    'TMP:surface',
  ],

  // GFS ONLY
  'snow': [
    'WEASD:surface',
    'SNOD:surface',
    'CPOFP:surface'
  ],

  // GFS ONLY
  'pres': [
    'PRES:surface',
    'MSLET:mean sea',
    'HGT:surface'
  ],

  'wave': [
    // GFS
    'LAND:surface',

    // WAVE
    'SWELL:1',
    'SWELL:2',
    'SWDIR:1',
    'SWDIR:2',
  ]
}

const DEFAULT_RESOLUTIONS = ['1p00', '0p50', '0p25']




const _args = process.argv
if(_args.length < 3)
  console.log(HELP_MSG)
else{
  const models = getModels()
  const _s = getArg('-s', _args) || 'GFS'
  const model = models.hasOwnProperty(_s.toUpperCase()) ? models[_s.toUpperCase()] : models.GFS

  const _d = getArg('-d', _args)
  const date =  _d !== null ? new _D_(_d) : getClosestModelRun(model, new _D_()._(model.meta.UTC_offset))

  const fc_range = getArg('-f', _args) || '0'

  const _r = getArg('-r', _args)
  const resolution = DEFAULT_RESOLUTIONS.includes(_r) ? _r : DEFAULT_RESOLUTIONS[0]


  switch(_args[2]){
    case 'download':
    const _g = getArg('-g', _args) || 'wind'
    const grid = DEFAULT_GRIDS[getArg('-g', _args)] || DEFAULT_GRIDS.wind
    const _j = _args.includes('-j')
    const _x = _args.includes('-x')
    const _q = _args.includes('-q')


    e2e(model, grid, date, fc_range, {
      prefixFilename: _g,
      resolution,
      dumpToJSON: _j,
      deleteTmpGRBFile: _x,
      logFunction: _q ? () => null : console.log
    })
    break


    case 'get-inventory':
    const _i = getArg('-i', _args)
    const UDT = _i !== null ? filteredUDT(_i) : []

    console.log('Inventory for ' + date.ymdh())

    getInventory({
      host: model.host,
      path: buildURL(model.path, {
        DATE: date.ymd(),
        FC: '000',
        HOUR: date.h(),
        RESOLUTION: resolution
      })
    })
    .then(r => {
      r.forEach((x, i) => {
        const splitedLine = x.split(':')
        const lvl = splitedLine[4]
        let pName = splitedLine[3]

        if(UDT.length == 1){
          const replacement = UDT[0][1].find(x => x.slug === pName)
          const fullName = replacement !== undefined && replacement.hasOwnProperty('name') ? replacement.name : '?'
          console.log(i + ') [' + pName + '] '+ fullName +' @' + lvl)
        }
        else{
          console.log(i + ') ' + pName + ' @' + lvl)
        }

       })
     })
    .catch(err => {
      console.log("Inventory not found. Try changing some parameters (eg: manually setting the date)")
      console.log("------------ HTTP ERROR ------------")
      console.log(err)
    })
    break


    case 'get-udt':
    filteredUDT(_args[3]).forEach((x, i, ar) => {
      console.log('------------ ' + x[0] + ' ------------')
      console.table(x[1])

      if(i !== ar.length - 1)
        console.log('\n')
    })
    break

    default:
    console.log(HELP_MSG)
  }
}
