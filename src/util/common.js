
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
