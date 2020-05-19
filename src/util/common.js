
var O = Object.prototype.toString

export var isArray = function(v) {
  
  return O.call(v) === '[object Array]'
  
}

export var isObject = function(v) {
  
  return O.call(v) === '[object Object]'
  
}

export var isNull = function(v) {
  
  return !v && typeof v === "object"

}

export var isNumber = function(v) {

  return !isNaN(parseFloat(v)) && isFinite(v)

}

export var newSpace = function(d, f) {

  if (f) return JSON.parse(JSON.stringify(d))

  if (isArray(d)) {

    if (d.length == 0 || (d.length > 0 && !isArray(d[0]) && !isObject(d[0])))
      return Object.assign([], d, [])

    var vd = []

    for (var i = 0, len = d.length; i < len; i++) {

      vd.push(newSpace(d[i]))

    }

    return vd

  }

  if (isObject(d)) {

    var nd = new Object()

    for (var p in d) nd[p] = newSpace(d[p])

    return nd

  }

  return d

}

export var samePoint = function(a, b) {

  return a[0] == b[0] && a[1] == b[1]

}

export var dist = function (a, b) {

  return Math.abs(a - b)

}

export var signFigures = function(num, dec) {

  dec = dec == void 0 ? 1 : dec

  var toExponential = (+num).toExponential(dec)
  var max = Number(toExponential)

  return max

}

export var getExtent = function(features) {

  var minx
  var miny
  var maxx
  var maxy

  for (var i = 0, iLen = features.length; i < iLen; i++) {

    var coors = features[i].geometry.coordinates

    for (var j = 0, jLen = coors.length; j < jLen; j++) {

      var cLen = coors[j].length

      if (!cLen) continue

      if (minx == void 0) {

        minx = maxx = coors[j][0][0]
        miny = maxy = coors[j][0][1]

      }

      minx = Math.min(minx, coors[j][0][0], coors[j][cLen - 1][0])
      miny = Math.min(miny, coors[j][0][1], coors[j][cLen - 1][1])
      maxx = Math.max(maxx, coors[j][0][0], coors[j][cLen - 1][0])
      maxy = Math.max(maxy, coors[j][0][1], coors[j][cLen - 1][1])

    }

  }

  return [
    minx,
    miny,
    maxx,
    maxy
  ]

}

export var buildExtent = function(extent) {

  return [
    [extent[1], extent[0]],
    [extent[3], extent[0]],
    [extent[3], extent[2]],
    [extent[1], extent[2]],
    [extent[1], extent[0]],
  ]

}
