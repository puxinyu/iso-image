/**
 * leaflet 地图叠加图层
 * @author kongkongbuding
 * @since 2019.08.08
 * @param {*} config 
 */
export var IsoLayer = function(config) {

  if ( !L.IsoImageCanvasLayer ) {

    L.IsoImageCanvasLayer = L.Canvas.extend({

      _initContainer: function () {

        var container = this._container = document.createElement('canvas')

        this._container.style.opacity = 0

        L.DomEvent.on(container, 'mousemove', L.Util.throttle(this._onMouseMove, 32, this), this)
        L.DomEvent.on(container, 'click dblclick mousedown mouseup contextmenu', this._onClick, this)
        L.DomEvent.on(container, 'mouseout', this._handleMouseOut, this)

        this._ctx = container.getContext('2d')

      },

      _draw: function () {

        var layer, bounds = this._redrawBounds
        var _ctx = this._ctx

        _ctx.save()

        if ( bounds ) {

          var size = bounds.getSize()

          _ctx.beginPath()
          _ctx.rect(bounds.min.x, bounds.min.y, size.x, size.y)
          _ctx.clip()

        }
    
        this._drawing = true
    
        for (var order = this._drawFirst; order; order = order.next) {

          layer = order.layer

          if ( !bounds || (layer._pxBounds && layer._pxBounds.intersects(bounds)) ) {
            
            var pattern = layer.options.pattern

            if (pattern && layer._rings[0]) {

              var pb = {
                min: {
                  x: Infinity,
                  y: Infinity
                },
                max: {
                  x: -Infinity,
                  y: -Infinity
                }
              }
  
              for (var i = 0; i < layer._rings[0].length; i++) {
  
                pb.min.x = Math.min(pb.min.x, layer._rings[0][i].x)
                pb.min.y = Math.min(pb.min.y, layer._rings[0][i].y)
                
                pb.max.x = Math.max(pb.max.x, layer._rings[0][i].x)
                pb.max.y = Math.max(pb.max.y, layer._rings[0][i].y)
  
              }
  
              var pbw = pb.max.x - pb.min.x
              var pbh = pb.max.y - pb.min.y
            
              var bs = layer._renderer._bounds

              var bsw = bs.max.x - bs.min.x
              var bsh = bs.max.y - bs.min.y

              var offset = [

                (((pb.max.x + pb.min.x) / 2 - bsw / 2) - bs.min.x) / bsw * 2,
                ((bsh / 2 - (pb.max.y + pb.min.y) / 2) + bs.min.y) / bsh * 2
                
              ]

              var scale = [pbw / bsw, pbh / bsh]

              _ctx.globalAlpha = layer.options.fillOpacity;

              _ctx.fillStyle = _ctx.createPattern(pattern({
                width: bsw,
                height: bsh,
                offset: offset,
                scale: scale
              }), 'repeat')

              _ctx.translate(bs.min.x, bs.min.y)
              _ctx.clearRect(0, 0, bsw, bsh)
              _ctx.fillRect(0, 0, bsw, bsh)

              _ctx.restore()

            } else {

              layer._updatePath()

              _ctx.restore()

            }

          }

        }
    
        this._drawing = false
        
        this.options.clipLayer && this.options.clipLayer._clip(_ctx)

      }

    })

  }

  return new L.IsoImageCanvasLayer(config)

}

export var ClipLayer = function(config) {

  if ( !L.ClipCanvasLayer ) {

    L.ClipCanvasLayer = L.Canvas.extend({

      _initContainer: function () {

        var container = this._container = document.createElement('canvas')
    
        L.DomEvent.on(container, 'mousemove', L.Util.throttle(this._onMouseMove, 32, this), this)
        L.DomEvent.on(container, 'click dblclick mousedown mouseup contextmenu', this._onClick, this)
        L.DomEvent.on(container, 'mouseout', this._handleMouseOut, this)
    
        this._ctx = container.getContext('2d')

      },
      _clip: function (ctx) {

        var _ctx = this._ctx
        _ctx.fillStyle = _ctx.createPattern(ctx.canvas, 'no-repeat')

        _ctx.beginPath()

        for (var order = this._drawFirst; order; order = order.next) {

          var layer = order.layer
          var parts = layer._parts

          for (var i = 0, len = parts.length; i < len; i++) {

            for (var j = 0, jLen = parts[i].length; j < jLen; j++) {

              _ctx[j ? 'lineTo' : 'moveTo'](parts[i][j].x, parts[i][j].y)

            }

          }

        }
        
        _ctx.save()
        _ctx.translate(this._bounds.min.x, this._bounds.min.y)
        _ctx.fill()
        _ctx.restore()

      }
      
    })

  }

  return new L.ClipCanvasLayer(config)
  
}
