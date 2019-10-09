
export const newSpace = function(d) {
  return JSON.parse(JSON.stringify(d))
}

export const samePoint = function(a, b) {
  return a[0] == b[0] && a[1] == b[1]
}

export const dist = function (a, b) {
  return Math.abs(a - b)
}

const O = Object.prototype.toString
export const isArray = function(v) {
  return O.call(v) === '[object Array]'
}
