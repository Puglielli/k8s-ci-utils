const commander = require('commander')
const k8s = require('@kubernetes/client-node')
const Rollback = require('./rollback')
const package = require('./package')

// Kubernetes-client Apis > [App, Core]
const kc = new k8s.KubeConfig()
kc.loadFromDefault()
const k8sApp = kc.makeApiClient(k8s.AppsV1Api)
const k8sCore = kc.makeApiClient(k8s.CoreV1Api)

const rollback = new Rollback(k8sApp)
const flags = new commander.Command()

flags.version(`${package.version}`, '-v, --version')
flags.addCommand(rollback.buildCommand())
flags.parse(process.argv)


const exec = () => {
  const options = {
    cluster: kc.getCurrentContext()
  }

  flags.commands.forEach(
    subCommand => {

      if (subCommand.name() == "rollback") {
        Object.assign(options, rollback.opts(subCommand.commands))
        rollback.generateFile(options)
      }
    }
  )
}

exec()
