var data = require('../combined.m6.json')
var jade = require('jade')
var fs = require('fs')
var _ = require('lodash')

var data = {}
data.raw = require('../combined.m3.json')

var dims = 22

// console.log(data.raw['setTag'].length) === 23

// truncate
data.raw = _.mapValues(data.raw, function(d){
    return d.slice(0,dims)
})

// data.raw = _.pick(data.raw, function(d,k){
//     return k.match(/([A-Z][a-z0-9]+)+/)
// })

// console.log(data.raw['setTag'])


var weights = _.fill(Array(dims),0)
_.forEach(data.raw, function(d){
    _.forEach(d, function(v,i){
        weights[i] += v
    })
})
// console.log(weights)

function normalize(d){
    return _.map(d, function(v,i){
        return v / weights[i] * 100
    })
}

data.normalized = _.mapValues(data.raw, normalize)

//console.log(data.normalized['WebViewContentsClientAdapter.3'])

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
var n = _.sum(data.raw['setTag'])

var m = _.sum(data.normalized['setTag'])
// === 0.0030386957893722174
console.log(m)
// var m = 0.0030386957893722174

var sorted = _.sortBy(features, 'total')
sorted.reverse()

sorted = _.filter(sorted, function(d){
    return d.keyword.match(/([A-Z][a-z0-9]+)+/)
})

var gps = _.groupBy(sorted, 'total')
var top = _.takeRight(_.pluck(_.values(gps),0),20)
// sorted = _.pluck(gps, 1)

// console.log(top)
// var top = sorted.slice(0,20)
// console.log(top)

var similar = _.filter(features, function(f){
    return Math.abs(f.total - n) < 200
})



var sortedNormalized = _.sortBy(features, 'totalNormalized')
sortedNormalized.reverse()

sortedNormalized = _.filter(sortedNormalized, function(d){
    return d.keyword.match(/([A-Z][a-z0-9]+)+/)
})

gps = _.groupBy(sortedNormalized, 'total')
var topN = _.takeRight(_.pluck(_.values(gps),0),20)

// var topN = sortedNormalized.slice(0,20)


// var setTag = features[].totalNormalized
var similarNormalized = _.filter(features, function(f){
    return Math.abs(f.totalNormalized - m) < 0.01
})

// console.log(sorted.slice(0,10))
var indices = {
    top10: top,
    similar: similar,
    top10N: topN,
    similarN: similarNormalized
}

function prepareChartData(data, indices, title, label){
    var columns =
        _(data)
        .pick(_.pluck(indices, 'keyword'))
        .pairs()
        .map(_.flatten)
        .map(function(d,i){
            d[0] = d[0].replace('toString', 'toS')
            return d
        })
        .value()

    return {
        title: title,
        columns: columns,
        label: label
    }
}

var xticks = _.flatten(_.map(['10','11','12','13','14','15'], function(y){
    return _.map(['Jan','Apr','July','Oct'],function(m){
        return m + ' ' + y
    })
}))

var xticks = xticks.slice(0,dims)

var chartData = {
    top10N: prepareChartData(data.normalized, indices['top10N'], 'Top 10 (Normalized)', '%'),
    similarN: prepareChartData(data.normalized, indices['similarN'], 'Similar to SetTag (Normalized)', '%'),
    top10: prepareChartData(data.raw, indices['top10'], 'Top 10 (Raw)', 'Total'),
    similar: prepareChartData(data.raw, indices['similar'], 'Similar to SetTag (Raw)', 'Total')
}
// console.log(chartData['top10'])

var html = jade.renderFile(__dirname + '/index.jade', {charts: chartData, _ : _, data: data, xticks: xticks})
fs.writeFile('./www/index.html',html, 'utf8')
