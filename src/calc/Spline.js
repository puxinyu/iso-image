
var Vector3 = function(a, b, c) {

  this.x = a || 0
  this.y = b || 0
  this.z = c || 0

}

Vector3.prototype = {
  constructor: Vector3,
  add: function(a) {

    this.x += a.x
    this.y += a.y
    this.z += a.z

    return this

  },
  subVectors: function(a, b) {

    this.x = a.x - b.x
    this.y = a.y - b.y
    this.z = a.z - b.z

    return this

  },
  distanceToSquared: function(a) {

    var b = this.x - a.x
    var c = this.y - a.y
    var a = this.z - a.z

    return b * b + c * c + a * a

  }
}

var CatmullRomCurve3 = (function() {

  var Curve = function() {}

  Curve.prototype = {
    getPoint: function() {

      console.log("Warning, getPoint() not implemented!")

      return null

    },
    getPointAt: function(a) {

      a = this.getUtoTmapping(a)

      return this.getPoint(a)

    },
    getPoints: function(a) {

      a || (a = 5)
      var b
      var c = []

      for (b = 0; b <= a; b++) {

        c.push(this.getPoint(b / a))

      }

      return c

    },
    getSpacedPoints: function (a) {

      a || (a = 5)

      var b
      var c = []

      for (b = 0; b <= a; b++) {
        
        c.push(this.getPointAt(b / a))

      }

      return c

    },
    getLength: function() {

      var a = this.getLengths()

      return a[a.length - 1]

    },
    getLengths: function(a) {

      a || (a = this.__arcLengthDivisions ? this.__arcLengthDivisions : 200)

      if ( this.cacheArcLengths && this.cacheArcLengths.length == a + 1 && !this.needsUpdate ) {

        return this.cacheArcLengths

      }

      this.needsUpdate = !1

      var b = []
      var c
      var d = this.getPoint(0)
      var e
      var f = 0

      b.push(0)

      for (e = 1; e <= a; e++) {

        c = this.getPoint(e / a)
        f += c.distanceTo(d), b.push(f)
        d = c

      }

      return this.cacheArcLengths = b

    },
    updateArcLengths: function() {

      this.needsUpdate = !0

      this.getLengths()

    },
    getUtoTmapping: function (a, b) {

      var c = this.getLengths()
      var d = 0
      var e = c.length
      var f

      f = b ? b : a * c[e - 1]

      for (var h = 0, g = e - 1, i; h <= g;) {

        if ( d = Math.floor(h + (g - h) / 2), i = c[d] - f, 0 > i ) {

          h = d + 1

        } else if ( 0 < i ) {
          
          g = d - 1

        } else {
          
          g = d

          break

        }

      }

      d = g

      if ( c[d] == f ) {

        return d / (e - 1)

      }

      h = c[d]

      return c = (d + (f - h) / (c[d + 1] - h)) / (e - 1)

    },
    getTangent: function(a) {

      var b = a - 1E-4
      var a = a + 1E-4

      0 > b && (b = 0)
      1 < a && (a = 1)

      b = this.getPoint(b)

      return this.getPoint(a).clone().sub(b).normalize()

    },
    getTangentAt: function(a) {

      a = this.getUtoTmapping(a)

      return this.getTangent(a)

    }
  }

  Curve.Utils = {
    tangentQuadraticBezier: function(a, b, c, d) {

      return 2 * (1 - a) * (c - b) + 2 * a * (d - c)

    },
    tangentCubicBezier: function(a, b, c, d, e) {

      return -3 * b * (1 - a) * (1 - a) + 3 * c * (1 - a) * (1 - a) - 6 * a * c * (1 - a) + 6 * a * d * (1 - a) - 3 * a * a * d + 3 * a * a * e

    },
    tangentSpline: function(a) {

      return 6 * a * a - 6 * a + (3 * a * a - 4 * a + 1) + (-6 * a * a + 6 * a) + (3 * a * a - 2 * a)

    },
    interpolate: function(a, b, c, d, e) {

      var a = 0.5 * (c - a)
      var d = 0.5 * (d - b)
      var f = e * e

      return (2 * b - 2 * c + a + d) * e * f + (-3 * b + 3 * c - 2 * a - d) * f + a * e + b

    }
  }

  Curve.create = function(a, b) {

    a.prototype = Object.create(Curve.prototype)
    a.prototype.getPoint = b

    return a

  }

  var CubicPoly = function() {}

  CubicPoly.prototype = {
    init: function(x0, x1, t0, t1) {

      this.c0 = x0
      this.c1 = t0
      this.c2 = -3 * x0 + 3 * x1 - 2 * t0 - t1
      this.c3 = 2 * x0 - 2 * x1 + t0 + t1
  
    },
    initNonuniformCatmullRom: function(x0, x1, x2, x3, dt0, dt1, dt2) {

      var t1 = (x1 - x0) / dt0 - (x2 - x0) / (dt0 + dt1) + (x2 - x1) / dt1
      var t2 = (x2 - x1) / dt1 - (x3 - x1) / (dt1 + dt2) + (x3 - x2) / dt2

      t1 *= dt1
      t2 *= dt1

      this.init(x1, x2, t1, t2)
  
    },
    initCatmullRom: function(x0, x1, x2, x3, tension) {

      this.init(x1, x2, tension * (x2 - x0), tension * (x3 - x1))
  
    },
    calc: function (t) {

      var t2 = t * t
      var t3 = t2 * t

      return this.c0 + this.c1 * t + this.c2 * t2 + this.c3 * t3
  
    }
  }

  var tmp = new Vector3()
  var px = new CubicPoly()
  var py = new CubicPoly()
  var pz = new CubicPoly()

  return Curve.create(

    function (p) {

      this.points = p || []
      this.closed = false

    },

    function (t) {

      var points = this.points
      var point
      var intPoint
      var weight
      var l = points.length

      if (l < 2) {
        
        console.log('duh, you need at least 2 points')

      }

      point = (l - (this.closed ? 0 : 1)) * t
      intPoint = Math.floor(point)
      weight = point - intPoint

      if ( this.closed ) {

        intPoint += intPoint > 0 ? 0 : (Math.floor(Math.abs(intPoint) / points.length) + 1) * points.length

      } else if ( weight === 0 && intPoint === l - 1 ) {

        intPoint = l - 2
        weight = 1

      }

      var p0
      var p1
      var p2
      var p3

      if ( this.closed || intPoint > 0 ) {

        p0 = points[(intPoint - 1) % l]

      } else {

        tmp.subVectors(points[0], points[1]).add(points[0])
        p0 = tmp

      }

      p1 = points[intPoint % l]
      p2 = points[(intPoint + 1) % l]

      if ( this.closed || intPoint + 2 < l ) {

        p3 = points[(intPoint + 2) % l]

      } else {

        tmp.subVectors(points[l - 1], points[l - 2]).add(points[l - 1])
        p3 = tmp

      }

      if ( this.type === undefined || this.type === 'centripetal' || this.type === 'chordal' ) {

        var pow = this.type === 'chordal' ? 0.5 : 0.25
        var dt0 = Math.pow(p0.distanceToSquared(p1), pow)
        var dt1 = Math.pow(p1.distanceToSquared(p2), pow)
        var dt2 = Math.pow(p2.distanceToSquared(p3), pow)

        if (dt1 < 1e-4) {

          dt1 = 1.0

        }

        if (dt0 < 1e-4) {

          dt0 = dt1
          
        }

        if (dt2 < 1e-4) {

          dt2 = dt1

        }

        px.initNonuniformCatmullRom(p0.x, p1.x, p2.x, p3.x, dt0, dt1, dt2)
        py.initNonuniformCatmullRom(p0.y, p1.y, p2.y, p3.y, dt0, dt1, dt2)
        pz.initNonuniformCatmullRom(p0.z, p1.z, p2.z, p3.z, dt0, dt1, dt2)

      } else if ( this.type === 'catmullrom' ) {

        var tension = this.tension !== undefined ? this.tension : 0.5

        px.initCatmullRom(p0.x, p1.x, p2.x, p3.x, tension)
        py.initCatmullRom(p0.y, p1.y, p2.y, p3.y, tension)
        pz.initCatmullRom(p0.z, p1.z, p2.z, p3.z, tension)

      }

      var v = new Vector3(
        px.calc(weight),
        py.calc(weight),
        pz.calc(weight)
      )

      return v

    }

  )

})()

var Spline = function(vec, NumPoints) {

  var ver = new Array()

  for ( var i = 0; i < vec.length; i++ ) {

    ver[i] = new Vector3(vec[i][0], vec[i][1], 0)

  }

  var curve = new CatmullRomCurve3(ver)
  var spline = curve.getPoints(NumPoints * ver.length)
  var splinePoints = new Array()

  for (var i = 0; i < spline.length; i++) {
    
    splinePoints.push([spline[i].x, spline[i].y])

  }

  return splinePoints
  
}

export default Spline
