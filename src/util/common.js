
export var newSpace = function(d) {

  return JSON.parse(JSON.stringify(d))

}

export var samePoint = function(a, b) {

  return a[0] == b[0] && a[1] == b[1]

}

export var dist = function (a, b) {

  return Math.abs(a - b)

}

var O = Object.prototype.toString

export var isArray = function(v) {
  
  return O.call(v) === '[object Array]'
  
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
