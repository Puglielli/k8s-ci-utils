const yaml = require('js-yaml')

const parseJson = (str) => {
  try {
    return JSON.parse(str)
  } catch (e) {
    return undefined
  }
}

const parseYaml = (str) => {
  try {
    return yaml.loadAll(str)
  } catch (e) {
    return undefined
  }
}

module.exports = {
  parseJson,
  parseYaml
}
