/**
 * 绘制等值面
 * @author kongkongbuding
 * @since 2020.05.15
 */

import getColor from '../calc/getColor'

var createShader = function(gl, sourceCode, type) {

  var shader = gl.createShader(type)

  gl.shaderSource(shader, sourceCode)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {

    var info = gl.getShaderInfoLog(shader)

    throw new Error('着色器程序构建失败！ \n\n' + info)

  }

  return shader

}

var createShaderProgram = function(gl, VSHADER_SOURCE, FSHADER_SOURCE) {

  var vertShader = createShader(gl, VSHADER_SOURCE, gl.VERTEX_SHADER)
  var fragShader = createShader(gl, FSHADER_SOURCE, gl.FRAGMENT_SHADER)
  
  var shaderProgram = gl.createProgram()

  gl.attachShader(shaderProgram, vertShader)
  gl.attachShader(shaderProgram, fragShader)
  gl.linkProgram(shaderProgram)
  gl.useProgram(shaderProgram)

  return shaderProgram

}

var createVertexBuffer = function(gl, data) {

  var buffer = gl.createBuffer()

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)

  var float32Data = new Float32Array(data)

  gl.bufferData(gl.ARRAY_BUFFER, float32Data, gl.STATIC_DRAW)

  return buffer

}

function IsosurfaceWebgl(extent, grid, level) {

  var canvas = document.createElement('canvas')
  var gl = canvas.getContext('webgl')

  if (!gl) {

    console.log('未发现 webgl !')

    return false

  }

  this.canvas = canvas
  this.gl = gl
  
  this.extent = extent
  this.grid = grid
  this.level = level

  this.setup(gl)

}

IsosurfaceWebgl.prototype = {
  /** */
  state: null,
  /** */
  canvas: null,
  /** */
  gl: null,
  /** */
  extent: [0, 0, 1, 1],
  /** */
  grid: null,
  /** */
  level: null,
  /** */
  program: null,
  /** */
  indices: [],
  /** */
  a_Position: null,
  a_Color: null,
  a_indices: null,
  /** */
  u_Scale: null,
  u_Offset: null,
  /** */
  constructor: IsosurfaceWebgl,
  /** */
  setup: function(gl) {
    
    this.initShaders(gl)

    this.initData(gl)

  },
  /** */
  initShaders: function(gl) {

    var VSHADER_SOURCE =
      `
        attribute vec2 a_Position;
        attribute vec4 a_Color;

        uniform float u_Scale;
        attribute vec2 u_Offset;
        
        varying vec4 aColor;

        void main() {
          
          aColor = a_Color;

          gl_Position = vec4((a_Position + u_Offset) * u_Scale, 0.0, 1.0);

        }
      `

    var FSHADER_SOURCE =
      `
        precision highp float;

        varying vec4 aColor;

        void main() {

          gl_FragColor = aColor;

        }
      `

    this.program = createShaderProgram(gl, VSHADER_SOURCE, FSHADER_SOURCE)

    this.u_Scale = gl.getUniformLocation(this.program, 'u_Scale')
    this.u_Offset = gl.getUniformLocation(this.program, 'u_Offset')

  },
  /** */
  initData: function(gl) {

    var extent = this.extent
    var grid = this.grid
    var level = this.level
    var col = 1
    var row = 1
    var features = grid.features
    var len = features.length
    var lng = features[0].geometry.coordinates[0]
    var size = [extent[1][0] - extent[0][0], extent[1][1] - extent[0][1]]
    
    for (var i = 1; i < len; i++) {

      if (features[i].geometry.coordinates[0] != lng) break
      
      col++

    }

    row = parseInt(len / col)

    var num = (col - 1) * (row - 1) * 2

    var vertices = new Float32Array(len * 2)
    var colors = new Float32Array(len * 4)
    var indices = new Uint16Array(num * 3)

    for (var i = 0; i < len; i++) {

      var coordinates = features[i].geometry.coordinates
      var val = features[i].properties.val
      var color = getColor(level, val, 1)

      vertices.set([
        ((coordinates[0] - extent[0][0]) / size[0]) * 2 - 1,
        ((coordinates[1] - extent[0][1]) / size[1]) * 2 - 1
      ], i * 2)

      colors.set([
        color.r / 255,
        color.g / 255,
        color.b / 255,
        color.a
      ], i * 3)

    }

    for (var i = 0; i < col - 1; i++) {

      for (var j = 9; j < row - 1; j++) {

        var ij = (i * (row - 1) + j) * 6
        var a = i * col + j
        var b = a + col
        var c = a + 1
        var d = b + 1

        indices.set([
          a, c, d,
          a, d, b
        ], ij)

      }

    }
    
    this.a_Position = createVertexBuffer(gl, vertices)
    this.a_Color = createVertexBuffer(gl, colors)

    var indicesBufferObject = gl.createBuffer()

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBufferObject )
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW)

    this.indices = indices
    this.a_indices = indicesBufferObject

  },
  render: function() {
    
    console.log(this.gl)
    var gl = this.gl

    gl.clearColor(0.0, 0.0, 0.0, 0.0)
    gl.clear(gl.COLOR_BUFFER_BIT)

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.a_indices )
    gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0)

    return this.canvas

  }
}

export default IsosurfaceWebgl
