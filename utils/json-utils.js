const isJson = (str) => {
  try {
    JSON.parse(str)
    return true
  } catch (e) {
    return false
  }
}

const parse = (str) => {
  try {
    return JSON.parse(str)
  } catch (e) {
    return undefined
  }
}

module.exports = {
  isJson,
  parse
}
