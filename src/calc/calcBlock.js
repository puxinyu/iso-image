/**
 * 区块计算
 * @author kongkongbuding
 * @since 2019.08.08
 */
import hitArea from './hitArea'
import search from './search'
import getColor from './getColor'
import { newSpace, samePoint, dist } from '../util/common'

var abs = Math.abs
var max = Math.max
var min = Math.min
var floor = Math.floor

var calcDir = function (p, ex) {

  var t = -1
  var dir = Infinity
  var min = [
    Math.abs(ex[0] - ex[2]) / 10,
    Math.abs(ex[1] - ex[3]) / 10
  ]

  for (var i = 0; i < 4; i++) {

    var iDir = dist(ex[i], p[i % 2])

    if ( iDir < min[i % 2] && iDir < dir ) {

      dir = iDir
      t = i

    }

  }

  if (t < 0) return false

  var dt = 'lbrt'.charAt(t)

  return dt
  
}

var offsetPoints = function(lines) {

  for (let p in lines) {

    let line = lines[p]

    for (let i = 0, len = line.length; i < len; i++) {

      let v = line[i]

      if (v.t != p) continue

      let index = p == 't' || p == 'b' ? 0 : 1

      for (let j = 0; j < len; j++) {

        let u = line[j]

        if (v.coor == u.coor || v.d != u.d) continue

        if (v.p[index] == u.p[index]) v.p[index] += (u.end[index] - v.end[index]) * 0.1
        if (v.end[index] == u.end[index]) v.end[index] += (u.p[index] - v.p[index]) * 0.1

      }

    }

  }

  return lines

}

/**
 * 
 * @param {Object} lines 等值线
 * @param {Array} extent [min-lat-左, min-lng-下, max-lat-右, max-lng-上]
 * @param {*} pointGrid 网格数据
 * @param {Array} level 颜色级别
 */

export default function(lines, extent, pointGrid, level) {

  var close = []
  var open = []
  var catchLine = []
  var side = {
    t: [],
    b: [],
    l: [],
    r: []
  }
  var features = lines.features

  for (var i = 0, il = features.length; i < il; i++) {

    var f = features[i]
    var c = f.geometry.coordinates

    for (var n = 0, nl = c.length; n < nl; n++) {
      
      var l = c[n]
      var first = l[0]
      var last = l[l.length - 1]

      // 闭环
      if ( samePoint(first, last) ) {

        close.push( {

          coor: l,
          properties: f.properties,
          child: [],
          parent: [],
          i: close.length

        } )

      }

      // 开环
      else {

        catchLine.push( {

          coor: l,
          properties: f.properties

        } )

        var fd = calcDir(first, extent)
        var ld = calcDir(last, extent)
        
        if (!fd || !ld) continue

        side[fd].push( {

          p: first,
          end: last,
          d: 0,
          t: ld,
          coor: catchLine.length - 1

        } )

        side[ld].push( {

          p: last,
          end: first,
          d: 1,
          t: fd,
          coor: catchLine.length - 1

        } )

      }

    }

  }

  var searchExtent = {

    sa: [extent[0], extent[3]],
    sb: [extent[2], extent[3]],
    sc: [extent[2], extent[1]],
    sd: [extent[0], extent[1]]

  }

  side = offsetPoints(side)

  open = search(catchLine, searchExtent, side, [searchExtent['sa']], 't', false)

  for (var i = 0, len = open.length; i < len; i++) {

    close.push( {

      coor: open[i],
      properties: {

        type: 'open'
        
      },
      child: [],
      parent: [],
      i: close.length

    } )

  }

  // 父子关系
  for (var i = 0, il = close.length; i < il; i++) {

    for (var j = i + 1; j < il; j++) {

      var iT = close[i].properties.type
      var jT = close[j].properties.type

      if ( iT != 'open' && hitArea(close[i].coor[0], close[j].coor) ) {

        close[j].child.push(i)
        close[i].parent.push(j)

      } else if ( jT != 'open' && hitArea(close[j].coor[0], close[i].coor) ) {

        close[i].child.push(j)
        close[j].parent.push(i)

      }

    }

  }
  
  // 生成区块
  var remain = newSpace(close)
  var buildItem = []
  var buildIndx = []
  var PIndex = []
  var orderTree = function () {

    if ( !remain.length ) {

      return false

    }

    var _remain = []

    for (var i = 0, il = remain.length; i < il; i++) {

      var r = remain[i]
      var child = r.child
      var iT = 1

      for (var jl = child.length,  j = jl - 1; j > -1; j --) {

        if (buildIndx.indexOf(child[j]) == -1) {

          iT = 0

        }

      }

      if ( iT ) {

        var nC = []

        for (var jl = child.length,  j = jl - 1; j > -1; j --) {

          var ind = PIndex.indexOf(child[j])

          if ( ind > -1 ) {

            nC.push(child[j])
            PIndex.splice(ind, 1)

          }

        }

        PIndex.push(r.i)
        buildIndx.push(r.i)
        remain[i].child = nC
        buildItem.push(remain[i])

        continue

      }

      _remain.push(remain[i])

    }

    if ( !_remain.length ) {
      
      return false

    }

    remain = _remain

    orderTree()

  }

  orderTree()
  
  var buildFeatures = []
  var pg = pointGrid.features
  var pl = pg.length
  var ft = pg[0].geometry.coordinates
  var row = 1
  var cw = 1
  var ch = 1

  for (var i = 0; i < pl; i++) {

    var tt = pg[i].geometry.coordinates

    if ( i == 1 ) {

      ch = abs(tt[1] - ft[1])

    }

    if ( tt[0] != ft[0] ) {

      row = i
      cw = abs(tt[0] - ft[0])

      break

    }

  }

  for (var i = 0, il = buildItem.length; i < il; i++) {

    var c = buildItem[i]
    var coordinates = [c.coor]
    var color = 'rgba(0, 0, 0, 0)'

    for (var j = 0, jl = c.child.length; j < jl; j++) {

      coordinates.push(close[c.child[j]].coor)

    }

    var ci = floor(c.coor.length / 2)
    var cp = c.coor[ci]
    var _col = (cp[0] - ft[0]) / cw
    var gi = max(floor(_col) * row + floor((cp[1] - ft[1]) / ch), 0)
    var target = _col % 1 ? 0 : 1
    var di = target ? 1 : row
    var _dx = target ? ch : cw
    var dx = _dx / 100
    var val

    if ( pg[gi] && pg[gi + di] ) {

      var np = pg[gi].geometry.coordinates
      var nep = pg[gi + di].geometry.coordinates
      var _cp = Object.assign([], cp, [])

      _cp[target] = max(cp[target] - dx, np[target])

      var va = pg[gi].properties.val
      var vb = pg[gi + di].properties.val

      if ( !hitArea(_cp, c.coor) ) {

        _cp[target] = min(cp[target] + dx * 2, nep[target])

      }

      if ( hitArea(_cp, c.coor) ) {

        val = va + (vb - va) * (abs(_cp[target] - pg[gi].geometry.coordinates[target]) / _dx)

      }

    } else if ( pg[gi] ) {

      val = pg[gi].properties.val

    }

    if ( val != void 0 ) {

      var _color = getColor(level, val, false)

      color = 'rgba(' + _color.r + ',' + _color.g + ',' + _color.b + ',' + _color.a + ')'
      val = _color.value

    }

    buildFeatures.push( {

      geometry: {

        coordinates: coordinates,
        type: 'MultiLineString'

      },
      properties: {

        val: val,
        color: color

      },
      type: 'Feature'

    } )

  }

  return {

    features: buildFeatures,
    type: "FeatureCollection"

  }
  
}
