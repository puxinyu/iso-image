/**
 * leaflet 图例
 * @author kongkongbuding
 * @since 2019.08.08
 * @param {*} config 
 */
export default function(config) {
  if (!L.Control.IsoLegendCortrol) {
    L.Control.IsoLegendCortrol = L.Control.extend({
      options: {
        position: 'bottomleft',
        canvas: ''
      },
      initialize: function(options) {
        L.Util.extend(this.options, options)
      },
      onAdd: function() {
        this._container = L.DomUtil.create('div', 'leaflet-control-iso-legend')
        this._container.appendChild(this.options.canvas)
        return this._container
      }
    })
  }
  return new L.Control.IsoLegendCortrol(config)
}
