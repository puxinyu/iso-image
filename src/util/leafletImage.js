/**
 * leaflet 图片叠加
 * @author kongkongbuding
 * @since 2019.08.08 
 */

import { buildExtent } from './common'

export default function(d, type, layer, config) {

  if (!d || !layer) return false
    
  var baseStyle = {

    stroke: true,
    weight: 1,
    color: '#000',
    opacity: 0.7,
    fillOpacity: 0.7,
    renderer: layer,
    smoothFactor: 0.5
    
  }

  config = config || {}

  var group = []
  var gradient = config.gradient
  var opt = this.option
  var filter = config.filter
  var extent = opt.extent

  if (type == 'polygon' && gradient && this.isosurfaceWebgl) {

    if (filter) this.isosurfaceWebgl.setFilter(filter)

    var _this = this

    return [

      L[type](
        buildExtent(extent),
        Object.assign(
          {},
          baseStyle,
          config,
          {
            pattern: function(config) {
              return _this.isosurfaceWebgl.render(config)
            }
          }
        )
      )

    ]

  }

  for (var i = 0, len = d.features.length; i < len; i++) {

    var v = d.features[i]
    var val = v.properties.val

    if (filter && filter.indexOf && filter.indexOf(val) == -1 || !v.geometry.coordinates.length) continue

    var style = Object.assign({}, baseStyle, {
      color: v.properties.color,
      fillColor: v.properties.color
    }, config)

    var marker = L[type](v.geometry.coordinates, style)

    group.push(marker)

  }

  return group

}
