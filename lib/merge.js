var glob = require('glob')
var path = require('path')
var fs = require('fs')
var _ = require('lodash')

// options is optional
glob("results/6_months/*.json", function (er, files) {
  // files is an array of filenames.
  // If the `nonull` option is set, and nothing
  // was found, then files is ["**/*.js"]
  // er is an error object or null.


  var all = {}
  _.forEach(files, function(file){

        var keyword = path.basename(file).match(/(.*)\.json/)[1]

        var data = JSON.parse(fs.readFileSync(file, 'utf8'))


        // console.log(keyword, _.pluck(data.intervals, 'count'))
        all[keyword] = _.pluck(data.intervals, 'count')

  })

  fs.writeFile('combined.json', JSON.stringify(all))
  // console.log(all)

})
