const fs = require('fs')
const path = require('path')

const isDirectory = path => fs.statSync(path).isDirectory()
const isFile = path => fs.statSync(path).isFile()

const getFile = (filename) => {
  if (fs.existsSync(filename)) {
    return fs.readFileSync(filename, 'utf8')
  } else {
    return undefined
  }
}

const getFiles = (dir, ...types) => {
  let files = undefined

  if (!isDirectory(dir)) return

  fs.readdirSync(dir)
    .filter(file => isFile(path.join(dir, file)) && types.indexOf(path.extname(file)) > -1)
    .forEach(
      file => {
        files?.push(getFile(path.join(dir, file))) ?? (files = [getFile(path.join(dir, file))])
      }
    )

  return files
}

const writeFile = (dir, obj) => {
  fs.writeFile(
    dir,
    obj,
    (err) => { if (err) throw err }
  )
}

module.exports = {
  getFile,
  getFiles,
  writeFile
}
