/**
 * 等值图生成
 * @author kongkongbuding
 * @since 2019.08.08
 */

import idw from './calc/idw'
import kriging from './calc/kriging'
import calcBlock from './calc/calcBlock'
import Spline from './calc/Spline'
import getLegend from './layer/legend'
import getIsoline from './layer/isoline'
import getIsosurface from './layer/isosurface'
import IsosurfaceWebgl from './util/isosurfaceWebgl'
import mix from './layer/mix'
import merge from './layer/merge'
import fmtGeoJson, { fmtLatLng } from './util/fmtGeoJson'
import { IsoLayer, ClipLayer } from './util/leafletLayer'
import { isArray, getExtent, signFigures, buildExtent, newSpace } from './util/common'
import leafletLegend from './util/leafletLegend'
import leafletImage from './util/leafletImage'
import fmtLevel from './util/fmtLevel'
import turfPointGrid from '@turf/point-grid'
import turfIsolines from '@turf/isolines'
import bezierSpline from '@turf/bezier-spline'
import { lineString } from '@turf/helpers'

var name = 'IsoImage'
var picture = 'image/png'
var units = 'degrees'
var sigma2 = 0.1
var alpha = 100
var isIE = 'ActiveXObject' in window
var min = Math.min
var max = Math.max
var abs = Math.abs
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

  // 初始化
  this.initialize(points, opt, callBack)

  // 获取等值面
  this.getIsosurface = function(config, key) {

    if ( !this.alow() ) return false

    var cav = mix(
      [
        getIsosurface.call(this, config)
      ],
      this.option,
      config
    )

    if ( key ) return cav

    return cav.toDataURL(picture)

  }
  
  // 获取等值线
  this.getIsoline = function(config, key) {

    if ( !this.alow() ) return false

    var cav = mix(
      [
        getIsoline.call(this, config)
      ],
      this.option,
      config
    )

    if ( key ) return cav

    return cav.toDataURL(picture)

  }

  // 获取等值面+等值线
  this.getIsoImage = function(config, key) {
    
    if ( !this.alow() ) return false

    var cav = mix(
      [
        getIsosurface.call(this, config),
        getIsoline.call(this, config)
      ],
      this.option,
      config
    )

    if ( key ) return cav

    return cav.toDataURL(picture)

  }

  // 获取图例
  this.getLegend = function(config, key) {
    
    var level = this.option.level || []
    var legend = getLegend(level, config)

    if ( !legend ) return false

    if ( key ) return legend
    
    return legend.toDataURL('image/png')

  }

  // 地图图层
  this.layer = function(map, config) {

    if ( !existLeaflet() ) return false
    
    config = Object.assign({}, {

      padding: 0,
      opacity: 0.1

    }, config)

    var clipLayer = ClipLayer(config)
    var style = {
      stroke: true,
      weight: 1,
      opacity: 0.7,
      fillOpacity: 0,
      color: 'rgba(0, 0, 0, 0)',
      fillColor: 'rgba(0, 0, 0, 0)',
      renderer: clipLayer
    }

    L['polygon'](this.option.fmtClip, style).addTo(map)

    config.clipLayer = clipLayer

    var isoLayer = IsoLayer(config)

    return isoLayer

  }

  // 地图 获取等值面
  this.getLeafletIsosurface = function(layer, config) {

    if ( !existLeaflet() ) return

    var d = this.fmtLatlngsIsosurface

    var group = leafletImage.call(this, d, 'polygon', layer, config)

    return L.featureGroup(group)

  }

  // 地图 获取等值线
  this.getLeafletIsoline = function(layer, config) {

    if ( !existLeaflet() ) return false

    var d = this.fmtLatlngsIsoline
    var group = leafletImage.call(this, d, 'polyline', layer, config)

    return L.featureGroup(group)

  }

  // 地图 获取等值面+等值线
  this.getLeafletIsoImage = function(layer, config) {

    if ( !existLeaflet() ) return false

    var isosurface = this.fmtLatlngsIsosurface
    var isoline = this.fmtLatlngsIsoline
    var isosurfaceGroup = leafletImage.call(this, isosurface, 'polygon', layer, config)
    var isolineGroup = leafletImage.call(this, isoline, 'polyline', layer, config)
    var group = isosurfaceGroup.concat(isolineGroup)

    return L.featureGroup(group)

  }

  // 地图 获取图例
  this.getLeafletLegend = function(config) {

    if ( !existLeaflet() ) return false

    config = Object.assign({}, {

      position: 'bottomleft',
      gradient: true

    }, config)

    var level = this.option.level || []
    var legend = getLegend(level, config)

    if ( !legend ) return false

    config.canvas = legend
    
    return leafletLegend(config)

  }

}

IsoImage.prototype = {
  /**
   * 
   */
  constructor: IsoImage,
  /**
   * 初始化
   * @param {*} points 
   * @param {*} opt 
   * @param {*} callBack 
   */
  initialize: function(points, opt, callBack) {

    var ex = opt.extent
    var level = opt.level

    if ( !ex ) return console.log('缺少参数extent(画布左上右下坐标)')

    if ( !level ) return console.log('缺少参数level(色阶)')

    level = fmtLevel(level)
    
    var extent = [
      min(ex[0][0], ex[1][0]),
      min(ex[0][1], ex[1][1]),
      max(ex[0][0], ex[1][0]),
      max(ex[0][1], ex[1][1])
    ]
    var size = [ex[1][0] - ex[0][0], ex[1][1] - ex[0][1]]
    var cellWidth = opt.cellWidth || signFigures(Math.sqrt(abs(size[0] * size[1] / 2000)))

    if ( isIE ) cellWidth *= 2

    var key = Object.assign({}, defaultKeyConfig, opt.keyConfig)

    this.option = {

      worker: opt.worker,
      type: opt.type || 'idw',
      pow: opt.pow || 3,
      model: opt.model || 'spherical', // gaussian|exponential|spherical
      clip: opt.clip,
      fmtClip: opt.clip ? fmtLatLng(newSpace(opt.clip), key.clipX, key.clipY) : buildExtent(extent),
      smooth: opt.smooth,
      ex: ex,
      extent: extent,
      size: size,
      cellWidth: cellWidth,
      level: level,
      key: key,
      webgl: opt.webgl == void 0 ? 1 : opt.webgl

    }

    var p = []
    var v = []
    var x = []
    var y = []
    
    if ( isArray(points) ) {

      for (var i = 0, len = points.length; i < len; i++) {

        if ( points[i][key.v] == void 0 ) continue

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
  /**
   * 计算网格值
   */
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
  /**
   * 计算等值线 面
   */
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

        var linesExtent = getExtent(lines.features)

        try {

          that.isosurface = calcBlock(lines, linesExtent, pointGrid, level)

        } catch (err) {

          console.log(err)

        }

        if (opt.webgl) that.isosurfaceWebgl = new IsosurfaceWebgl(opt.ex, pointGrid, level)

        if (opt.smooth) {
          
          that.isoline = that.smooth(that.isoline)

          if (that.isosurface) that.isosurface = that.smooth(that.isosurface)

        }

        that.fmtLatlngsIsoline = fmtGeoJson(that.isoline)

        if (that.isosurface) that.fmtLatlngsIsosurface = fmtGeoJson(that.isosurface)

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

    try {

      this.isosurface = calcBlock(lines, opt.extent, pointGrid, level)

    } catch (err) {

      console.log(err)

    }

    if (opt.webgl) this.isosurfaceWebgl = new IsosurfaceWebgl(opt.ex, pointGrid, level)

    if (opt.smooth) {
          
      this.isoline = this.smooth(this.isoline)
      this.isosurface = this.smooth(this.isosurface)

    }

    this.fmtLatlngsIsoline = fmtGeoJson(this.isoline)
    this.fmtLatlngsIsosurface = fmtGeoJson(this.isosurface)
    this.isoLinesState = true

  },
  /**
   * 平滑
   * @param {*} GeoJson 
   */
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
  /**
   * 平滑
   * @param {*} GeoJson 
   */
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
  /**
   * 计算完成检测
   */
  alow: function() {

    return this.pointGrid && this.isoline

  },
  /**
   * 准备好了吗？
   */
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
  /**
   * 移除
   */
  remove: function() {

    for (var p in this) {

      delete this[p]

    }

    return this
    
  }
}

IsoImage.merge = merge
