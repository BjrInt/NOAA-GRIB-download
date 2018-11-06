const { exec } = require('child_process')

// Fix eccodes buggy JSON dump
const { JSON_comma, JSON_nest, flattenJSON } = require('./helpers.js')

const BUF_SIZE = 8 * 1024 * 1024 * 8 // 8Mb should be enough for a single 0p25 JSON grid, extend if needed

const grib_dump = (file, bufferSize=BUF_SIZE) => new Promise((resolve, reject) => {
  exec('grib_dump ' + file + ' -j', {maxBuffer: bufferSize}, (err, stdout, stderr) => {
    const file_content = flattenJSON(JSON_nest(JSON_comma(stdout)))

    resolve(file_content)
    reject([err, stderr])
  })
})

module.exports = grib_dump
