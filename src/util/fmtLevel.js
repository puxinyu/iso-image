/**
 * 格式化等级
 * @author kongkongbuding
 * @since 2019.08.08
 * @param {*} level 
 */
const fmtLevel = function(level) {
  for (var i = 0, len = level.length; i < len; i++) {
    var color = level[i].color
    level[i].r = parseInt(color.substr(1, 2), 16)
    level[i].g = parseInt(color.substr(3, 2), 16)
    level[i].b = parseInt(color.substr(5, 2), 16)
  }
  return level
}

export default fmtLevel
