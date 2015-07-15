var data = require('../combined.m6.json')
var jade = require('jade')
var fs = require('fs')
var _ = require('lodash')

var data = {}
data.raw = require('../combined.m6.json')


var weights = _.fill(Array(12),0)
// console.log(weights)
_.forEach(data.raw, function(d){
    _.forEach(d, function(v,i){
        weights[i] += v
    })
})

function normalize(d){
    return _.map(d, function(v,i){
        return v / weights[i]
    })
}

data.normalized = _.mapValues(data.raw, normalize)

// console.log(data.raw['setTag'], data.normalized['setTag'])
var features = _.map(data.raw, function(d, key){
    var f = {
        keyword: key,
        total: _.sum(d),
        totalNormalized: _.sum(data.normalized[key])
    }
    return f
})

// console.log(features)

// console.log(_.sum(data['setTag'])) === 26927
var n = 26927

// console.log(_.sum(normalize(data['setTag'])))
// === 0.0030386957893722174
var m = 0.0030386957893722174

var sorted = _.sortBy(features, 'total')
sorted.reverse()

var similar = _.filter(features, function(f){
    return Math.abs(f.total - n) < 200
})

var sortedNormalized = _.sortBy(features, 'totalNormalized')
sortedNormalized.reverse()

// var setTag = features[].totalNormalized
var similarNormalized = _.filter(features, function(f){
    return Math.abs(f.totalNormalized - m) < 0.0001
})

// console.log(sorted.slice(0,10))
var indices = {
    top10: sorted.slice(0,10),
    similar: similar,
    top10N: sortedNormalized.slice(0,10),
    similarN: similarNormalized
}

function prepareChartData(data, indices, title){
    var columns =
        _(data)
        .pick(_.pluck(indices, 'keyword'))
        .pairs()
        .map(_.flatten)
        .value()

    return {
        title: title,
        columns: columns
    }
}

var chartData = {
    top10: prepareChartData(data.raw, indices['top10'], 'Top 10 (Raw)'),
    top10N: prepareChartData(data.normalized, indices['top10N'], 'Top 10 (Normalized)'),
    similar: prepareChartData(data.raw, indices['similar'], 'Total similar to SetTag (Raw)'),
    similarN: prepareChartData(data.normalized, indices['similarN'], 'Total similar to SetTag (Normalized)')
}
console.log(chartData['top10'])

var html = jade.renderFile(__dirname + '/index.jade', {charts: chartData, _ : _, data: data})
fs.writeFile('./www/index.html',html, 'utf8')
