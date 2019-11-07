/**
 * leaflet 图片叠加
 * @author kongkongbuding
 * @since 2019.08.08 
 */

export default function(d, type, layer, config) {

  if (!d || !layer) {

    return false

  }

  var group = []
  var filter = config.filter

  for (var i = 0; d.features[i]; i++) {

    var v = d.features[i]
    var val = v.properties.val

    if (filter && filter.indexOf && filter.indexOf(val) == -1 || !v.geometry.coordinates.length) {

      continue

    }

    var style = Object.assign({}, {

      stroke: true,
      weight: 1,
      opacity: 0.7,
      fillOpacity: 0.7,
      color: v.properties.color,
      fillColor: v.properties.color,
      renderer: layer,
      smoothFactor: 0.5
      
    }, config)

    var marker = L[type](v.geometry.coordinates, style)

    group.push(marker)

  }

  return group

}
