const { Console } = require('console')
const fs = require('fs')

class Logger {
  constructor(stdout = './stdout.log', stderr = './stderr.log', ignoreErrors = false, colorMode = false) {
    return new Console(
      {
        stdout: fs.createWriteStream(stdout),
        stderr: fs.createWriteStream(stderr),
        ignoreErrors: ignoreErrors,
        colorMode: colorMode
      }
    )
  }
}

module.exports = Logger
