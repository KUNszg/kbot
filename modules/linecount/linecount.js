const fs = require('fs')
const isStream = require('is-stream')
const split2 = require('split2')

module.exports = function(filename, cb) {
  let count = 0
  const stream = isStream(filename) ? filename : fs.createReadStream(filename)

  stream
    .once('error', cb)
    .pipe(split2())
    .on('data', function () {
      count++
    })
    .on('end', function () {
      cb(null, count)
    })
}
