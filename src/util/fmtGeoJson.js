
/**
 * [lng, lat] => [lat, lng]
 * @param {Array} latlngs 经纬度数组
 * @param {Number} deep 数组层级
 */

import { newSpace, isNumber } from './common'

export var fmtLatLng = function(latlngs, x, y) {

  if ( y === void 0 ) {
    
    y = 1

  }

  if ( x === void 0 ) {

    x = 0

  }

  if ( isNumber(latlngs[x]) ) {

    return [latlngs[y], latlngs[x]]

  } 

  for (var i = 0, len = latlngs.length; i < len; i++) {

    latlngs[i] = fmtLatLng(latlngs[i], x, y)

  }

  return latlngs

}

var fmtGeoJson = function(data) {

  var d = newSpace(data)

  for (var i = 0, len = d.features.length; i < len; i++) {

    var coor = d.features[i].geometry.coordinates
    
    d.features[i].geometry.coordinates = fmtLatLng(coor)

  }

  return d

}

export default fmtGeoJson
