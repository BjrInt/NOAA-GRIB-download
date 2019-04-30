const {
  readdirSync,
  readFileSync
} = require('fs')
const http = require('https')
const path = require('path')

const UD_TABLES_PATH = path.resolve(__dirname, 'user_defined_tables')
const MODELS_PATH = path.resolve(__dirname, 'models')

const getGRIB = (options) => new Promise((resolve, reject) => {
  http.get(options, r => {
    if ([500, 404, 400, 403].includes(r.statusCode))
      reject(r.statusCode)

    else {
      let curOffset = 0
      const bufLen = parseInt(r.headers['content-length'])
      const res = Buffer.alloc(bufLen)

      r.on('data', s => {
        s.copy(res, curOffset)
        curOffset += s.length
      })

      r.on('end', () => resolve(res))

      r.on('error', err => reject(err))
    }
  })
})

const getInventory = (options) => new Promise((resolve, reject) => {
  http.get({
    ...options,
    path: options.path.endsWith('.idx') ? options.path : options.path + '.idx'
  }, r => {
    if ([500, 404, 400, 403].includes(r.statusCode))
      reject(r.statusCode)
    else {
      let res = ''

      r.on('data', s => {
        res += s
      })

      r.on('end', () => resolve(res.split('\n')))

      r.on('error', err => reject(err))
    }
  })
})

const parseUDTable = str => str.split('\n').map(x => {
  const [id, slug, name] = x.split(':')
  return {
    id,
    slug,
    name
  }
})

const getUDTables = () => readdirSync(UD_TABLES_PATH)
  .reduce((ac, cv) => ac = {
    ...ac,
    [cv.replace('.txt', '')]: parseUDTable(readFileSync(UD_TABLES_PATH + '/' + cv, 'utf-8'))
  }, {})

const getModels = () => readdirSync(MODELS_PATH)
  .reduce((ac, cv) => ac = {
    ...ac,
    [cv.replace('.json', '')]: JSON.parse(readFileSync(MODELS_PATH + '/' + cv, 'utf-8'))
  }, {})

const getOptionsFromPath = path => {
  let ret = []
  path.replace(/%(\w+)%/gi, (match, p, offset, string) => {
    if (!ret.includes(p)) ret.push(p)
  })
  return ret
}

const buildURL = (path, options) => path.replace(/%(\w+)%/gi, (match, p, offset, string) => options.hasOwnProperty(p) ? options[p] : '')

const getLineFromInventory = (pname, inventory) => inventory.findIndex(k => k.match(new RegExp(pname, 'gi')))

const getRangeOffset = (lines, inventory) => {
  let ret = []
  lines.sort((a, b) => a - b).forEach(x => {
    const offsetA = inventory[x].split(':')[1]
    const offsetB = (x === inventory.length - 1) ? '' : inventory[x + 1].split(':')[1]

    ret.push(offsetA + '-' + offsetB)
  })

  return 'bytes=' + ret.join(', ')
}

const parseFC = x => String(x).padStart(3, '0')

const euclid = (x, d) => x - (x % d)

const getClosestModelRun = (model, t) => {
  if (model.meta.hasOwnProperty('runtime')) {
    const closest = model.meta.runtime.filter(x => x <= parseInt(t.h())).sort((a, b) => b - a)[0]
    return t.set(closest)
  }

  return t
}

// BUGFIX
// For some reason eccodes dumps several objects without placing a comma inbetween...
const JSON_comma = j => j.replace(/(\]|\})(\s*)(\[|\{)/mgi, '$1,$2$3')

// BUGFIX
// For some reason eccodes does not nest several grid into a single JSON object
const JSON_nest = j => '[' + j + ']'

const flattenJSON = j => {
  let messages = []
  const json = JSON.parse(j)


  const reorder = message => {
    let ret_msg = {
      headers: {},
      data: []
    }

    message.forEach(entry => {
      if (entry.key !== 'values')
        ret_msg.headers[entry.key] = entry.value
      else
        ret_msg.data = entry.value
    })

    messages.push(ret_msg)
  }

  if (Array.isArray(json))
    json.forEach(reorder)
  else
    reorder(json)

  return JSON.stringify(messages)
}

module.exports = {
  parseUDTable,
  getUDTables,
  getModels,
  getOptionsFromPath,
  buildURL,
  getLineFromInventory,
  getRangeOffset,
  getGRIB,
  getInventory,
  parseFC,
  euclid,
  getClosestModelRun,
  JSON_comma,
  JSON_nest,
  flattenJSON
}
