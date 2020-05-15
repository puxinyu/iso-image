/**
 * 绘制等值面
 * @author kongkongbuding
 * @since 2019.08.08
 * @param {Object} opt isoimage option
 * @param {Object} pointGrid 网格
 * @param {Object} isosurface
 * @param {Object} config 图片配置 width: 图片宽度 opacity: 透明度 gradient 是否渐变, filter 过滤筛选 
 */

import isosurfaceNormal from './isosurfaceNormal'

export default function(opt, pointGrid, isosurface, config) {

  config = config || {}

  var gradient = config.gradient == void 0 ? true : config.gradient
  var size = opt.size
  var cellWidth = opt.cellWidth
  var level = opt.level
  var ex = opt.ex
  var filter = config.filter
  var width = config.width || 1000
  var height = Math.abs((width / size[0]) * size[1])
  var canvas = document.createElement('canvas')

  canvas.width = width
  canvas.height = height

  return isosurfaceNormal.apply(this, arguments)
  
}
