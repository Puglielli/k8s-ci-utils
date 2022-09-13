const fs = require('fs')
const commander = require('commander')
const k8s = require('@kubernetes/client-node')
const Rollback = require('./rollback')

// Kubernetes-client Apis > [App, Core]
const kc = new k8s.KubeConfig()
kc.loadFromDefault()
const k8sApp = kc.makeApiClient(k8s.AppsV1Api)
const k8sCore = kc.makeApiClient(k8s.CoreV1Api)

const rollback = new Rollback(k8sApp, fs)
const flags = new commander.Command()

flags.version('1.0.0', '-v, --version')
flags.addCommand(rollback.buildCommand())
flags.parse(process.argv)


const exec = () => {
  flags.commands.forEach(subCommand => {
      
    if (subCommand.name() == "rollback" && rollback.existGenerateFile(subCommand.commands)) {
      const options = rollback.opts(subCommand.commands)

      options.cluster = kc.getCurrentContext()
      rollback.generateFile(options)
    }
  })
}

exec()
