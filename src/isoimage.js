/**
 * 等值图生成
 * @author kongkongbuding
 * @since 2019.08.08
 */

import idw from './calc/idw'
import kriging from './calc/kriging'
import calcBlock from './calc/calcBlock'
import getLegend from './layer/legend'
import getIsosurface from './layer/isosurface'
import getIsoline from './layer/isoline'
import mix from './layer/mix'
import fmtGeoJson, { fmtLatLng } from './util/fmtGeoJson'
import { IsoLayer, ClipLayer } from './util/leafletLayer'
import { isArray } from './util/common'
import leafletLegend from './util/leafletLegend'
import leafletImage from './util/leafletImage'
import fmtLevel from './util/fmtLevel'
import merge from './layer/merge'
import turfPointGrid from '@turf/point-grid'
import turfIsolines from '@turf/isolines'
import bezierSpline from '@turf/bezier-spline'
import { lineString } from '@turf/helpers'
import Spline from './calc/Spline'

var name = 'IsoImage'
var picture = 'image/png'
var units = 'degrees'
var sigma2 = 0.1
var alpha = 100
var isIE = 'ActiveXObject' in window
var min = Math.min
var max = Math.max
var abs = Math.abs
var round = Math.round
var flot = 1000000
var defaultKeyConfig = {
  x: 'x',
  y: 'y',
  v: 'v',
  clipX: '0',
  clipY: '1'
}

var existLeaflet = function() {

  var l = 'L' in window

  if (!l) {
    
    console.log('未加载leaflet')

  }

  return l

}

export default function IsoImage(points, opt, callBack) {

  this.name = name

  this.initialize(points, opt, callBack)

  this.getIsosurface = function(config, key) {

    if ( !this.alow() ) {

      return false

    }

    var cav = mix(
      [
        getIsosurface(this.option, this.pointGrid, this.isosurface, config)
      ],
      this.option,
      config
    )

    if ( key ) {
      
      return cav

    } 

    return cav.toDataURL(picture)

  }
  
  this.getIsoline = function(config, key) {

    if ( !this.alow() ) {

      return false

    }

    var cav = mix(
      [
        getIsoline(this.option, this.isoline, config)
      ],
      this.option,
      config
    )

    if ( key ) {

      return cav

    }

    return cav.toDataURL(picture)

  }

  this.getIsoImage = function(config, key) {
    
    if ( !this.alow() ) {

      return false

    }

    var cav = mix(
      [
        getIsosurface(this.option, this.pointGrid, this.isosurface, config),
        getIsoline(this.option, this.isoline, config)
      ],
      this.option,
      config
    )

    if ( key ) {

      return cav

    }

    return cav.toDataURL(picture)

  }
  this.getLegend = function(config, key) {
    
    var level = this.option.level || []
    var legend = getLegend(level, config)

    if ( !legend ) {

      return false

    }

    if ( key ) {

      return legend

    }
    
    return legend.toDataURL('image/png')

  }
  this.layer = function(map, config) {

    if ( !existLeaflet() ) {

      return false

    } 
    
    config = Object.assign({}, {

      padding: 0.5,
      opacity: 0.1

    }, config)

    var clipLayer = ClipLayer(config)
    var style = {
      stroke: true,
      weight: 1,
      opacity: 0.7,
      fillOpacity: 0,
      color: '#ff0000',
      fillColor: '#ff0000',
      renderer: clipLayer
    }

    L['polygon'](this.option.fmtClip, style).addTo(map)

    config.clipLayer = clipLayer

    var isoLayer = IsoLayer(config)

    return isoLayer

  }

  this.getLeafletIsosurface = function(layer, config) {

    if ( !existLeaflet() ) return

    var d = this.fmtLatlngsIsosurface
    var group = leafletImage(d, 'polygon', layer, config)
    return L.featureGroup(group)
  }
  this.getLeafletIsoline = function(layer, config) {
    if ( !existLeaflet() ) {

      return false

    }

    var d = this.fmtLatlngsIsoline
    var group = leafletImage(d, 'polyline', layer, config)

    return L.featureGroup(group)

  }
  this.getLeafletIsoImage = function(layer, config) {

    if ( !existLeaflet() ) {

      return false

    }

    var isosurface = this.fmtLatlngsIsosurface
    var isoline = this.fmtLatlngsIsoline
    var isosurfaceGroup = leafletImage(isosurface, 'polygon', layer, config)
    var isolineGroup = leafletImage(isoline, 'polyline', layer, config)
    var group = isosurfaceGroup.concat(isolineGroup)

    return L.featureGroup(group)

  }

  this.getLeafletLegend = function(config) {

    if ( !existLeaflet() ) {

      return false

    }

    config = Object.assign({}, {

      position: 'bottomleft',
      gradient: true

    }, config)

    var level = this.option.level || []
    var legend = getLegend(level, config)

    if ( !legend ) {

      return false

    }

    config.canvas = legend
    
    return leafletLegend(config)

  }

}

IsoImage.prototype = {
  constructor: IsoImage,
  initialize: function(points, opt, callBack) {

    var ex = opt.extent
    var level = opt.level

    if ( !ex ) {

      return console.log('缺少参数extent(画布左上右下坐标)')

    } 

    if ( !level ) {

      return console.log('缺少参数level(色阶)')

    }

    level = fmtLevel(level)
    
    var extent = [
      min(ex[0][0], ex[1][0]),
      min(ex[0][1], ex[1][1]),
      max(ex[0][0], ex[1][0]),
      max(ex[0][1], ex[1][1])
    ]
    var size = [ex[1][0] - ex[0][0], ex[1][1] - ex[0][1]]
    var cellWidth = opt.cellWidth || round((abs(size[0]) / 200) * flot) / flot

    if ( isIE ) {

      cellWidth *= 3

    }

    var key = Object.assign({}, defaultKeyConfig, opt.keyConfig)

    this.option = {

      worker: opt.worker,
      type: opt.type || 'idw',
      pow: opt.pow || 3,
      model: opt.model || 'spherical', // gaussian|exponential|spherical
      clip: opt.clip,
      fmtClip: fmtLatLng(JSON.parse(JSON.stringify(opt.clip)), 2, key.clipX, key.clipY),
      smooth: opt.smooth,
      ex: ex,
      extent: extent,
      size: size,
      cellWidth: cellWidth,
      level: level,
      key: key

    }

    var p = []
    var v = []
    var x = []
    var y = []
    
    if ( isArray(points) ) {

      for (var i = 0, len = points.length; i < len; i++) {

        if ( points[i][key.v] == void 0 ) {

          continue

        }

        var _v = points[i][key.v]
        var _x = points[i][key.x]
        var _y = points[i][key.y]

        p.push({
          x: _x,
          y: _y,
          v: _v
        })
        v.push(_v)
        x.push(_x)
        y.push(_y)

      }

    }

    this.points = p
    this._v = v
    this._x = x
    this._y = y

    var that = this

    if ( opt.worker && window.Worker && !isIE ) {

      var pointGridWorker = new Worker(opt.worker + '/turf.js')

      pointGridWorker.onmessage = function(e) {

        that.pointGrid = e.data
        that.calcGridValue()

        callBack && that.initReady(callBack)

      }

      pointGridWorker.postMessage(['pointGrid', extent, cellWidth, { units: units }])

      return false

    }

    this.pointGrid = turfPointGrid(extent, cellWidth, { units: units })
    this.calcGridValue()

    callBack && this.initReady(callBack)

  },
  calcGridValue: function() {

    var opt = this.option
    var pointGrid = this.pointGrid
    var a = this._v
    var b = this._x
    var c = this._y
    var d = opt.model
    var e = sigma2
    var f = alpha

    switch (opt.type) {

      case 'kriging':

        if ( opt.worker && window.Worker && !isIE ) {

          var krigingWorker = new Worker(opt.worker + '/' + opt.type + '.js')
          var that = this

          krigingWorker.onmessage = function(e) {

            that.pointGrid = e.data
            that.pointGridState = true
            that.calcIso()

          }

          krigingWorker.postMessage([pointGrid, a, b, c, d, e, f])

          return false

        }

        var variogram = kriging.train(a, b, c, d, e, f )

        for (var i = 0; i < pointGrid.features.length; i++) {

          var krigingVal = kriging.predict(

            pointGrid.features[i].geometry.coordinates[0],
            pointGrid.features[i].geometry.coordinates[1],
            variogram

          )

          pointGrid.features[i].properties.val = krigingVal

        }

        this.pointGridState = true
        this.calcIso()

        break

      default:

        var points = this.points

        if ( opt.worker && window.Worker && !isIE ) {

          var defaultWorker = new Worker(opt.worker + '/' + opt.type + '.js')
          var that = this

          defaultWorker.onmessage = function(e) {

            that.pointGrid = e.data
            that.pointGridState = true
            that.calcIso()

          }

          defaultWorker.postMessage([points, pointGrid, opt.pow])

          return false

        }

        this.pointGrid = idw(points, pointGrid, opt.pow)
        this.pointGridState = true

        this.calcIso()

        break

    }

  },
  calcIso: function() {

    var opt = this.option
    var pointGrid = this.pointGrid
    var level = opt.level
    var breaks = []
    var that = this

    for (var i = 0, len = level.length; i < len; i++) {

      breaks.push(level[i].value)

    }

    if ( opt.worker && window.Worker && !isIE ) {

      var turfIsolinesWorker = new Worker(opt.worker + '/turf.js')
      var that = this

      turfIsolinesWorker.onmessage = function(e) {

        var lines = e.data

        that.isoline = lines
        that.isosurface = calcBlock(lines, opt.extent, pointGrid, level)

        if (opt.smooth) {
          
          that.isoline = that.smooth(that.isoline)
          that.isosurface = that.smooth(that.isosurface)

        }

        that.fmtLatlngsIsoline = fmtGeoJson(that.isoline)
        that.fmtLatlngsIsosurface = fmtGeoJson(that.isosurface)

        that.isoLinesState = true

      }

      turfIsolinesWorker.postMessage(['isolines', pointGrid, breaks, { zProperty: 'val' }, level])

      return false

    }
    
    var lines = turfIsolines(pointGrid, breaks, { zProperty: 'val' })
    var d = lines.features

    for (var i = 0, len = d.length; i < len; i++) {

      var val = d[i].properties.val

      for (var q = 0; level[q]; q++) {
        
        if ( level[q].value == val ) {

          d[i].properties.color = level[q].color

          break

        }

      }

    }

    this.isoline = lines
    this.isosurface = calcBlock(lines, opt.extent, pointGrid, level)

    if (opt.smooth) {
          
      this.isoline = this.smooth(this.isoline)
      this.isosurface = this.smooth(this.isosurface)

    }

    this.fmtLatlngsIsoline = fmtGeoJson(this.isoline)
    this.fmtLatlngsIsosurface = fmtGeoJson(this.isosurface)
    this.isoLinesState = true

  },
  smooth: function(GeoJson) {

    var lFeatures = GeoJson.features

    for (var i = 0; i < lFeatures.length; i++) {
      
      var coords = lFeatures[i].geometry.coordinates
      var lCoords = []

      for (var j = 0; j < coords.length; j++) {
        
        var coord = coords[j]
        var curved = Spline(coord, 5)
        lCoords.push(curved)

      }

      lFeatures[i].geometry.coordinates = lCoords

    }

    return GeoJson

  },
  smooth2: function(GeoJson) {

    var lFeatures = GeoJson.features

    for (var i = 0; i < lFeatures.length; i++) {
      
      var coords = lFeatures[i].geometry.coordinates
      var lCoords = []

      for (var j = 0; j < coords.length; j++) {

        var coord = coords[j]
        var line = lineString(coord)
        var curved = bezierSpline(line, {
          
          resolution: coord.length * 600,
          sharpness: 0.85,
          stepLength: 1

        })

        lCoords.push(curved.geometry.coordinates)

      }

      lFeatures[i].geometry.coordinates = lCoords

    }

    return GeoJson

  },
  alow: function() {

    return this.pointGrid && this.isoline

  },
  initReady: function(callBack, config) {

    var timer = null
    var that = this

    timer = setInterval(function() {

      if ( that.pointGridState && that.isoLinesState ) {

        clearInterval(timer)

        callBack && callBack(that, config)

      }

    }, 10)

  },
  remove: function() {

    for (var p in this) {

      delete this[p]

    }

    return this
    
  }
}

IsoImage.merge = merge
