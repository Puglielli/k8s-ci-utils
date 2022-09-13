const commander = require('commander')
const { parse } = require('./utils/json-utils')

class Rollback {
  constructor(k8s, fs) {
    this.k8s = k8s
    this.fs = fs
  }

  buildCommand = () => {
    const cmd = new commander.Command('rollback')

    cmd
      .command('generate-file')
      .requiredOption('-n, --namespace <string>', 'Kubernetes namespace.')
      .requiredOption('-d, --deployment <string...>', 'Kubernetes deployment name.')
      .requiredOption('-f, --filename <string>', 'Rollback file name.')
      .option('-c, --container <string>', 'Kubernetes container name.')

    cmd
      .command('exec')
      .requiredOption('-n, --namespace <string>', 'Kubernetes namespace.')
      .requiredOption('-d, --deployment <string>', 'Kubernetes deployment name.')
      .requiredOption('-r, --revision <string>', 'Kubernetes revision id.')

    return cmd
  }

  existGenerateFile = (commands) => commands.filter(i => i.name() == "generate-file").length > 0
  getGenerateFile = (commands) => commands.filter(i => i.name() == "generate-file")[0]
  existExec = (commands) => commands.filter(i => i.name() == "exec").length > 0
  getExec = (commands) => commands.filter(i => i.name() == "exec")[0]
  opts = (commands) => this.getGenerateFile(commands).opts()

  buildItem = (options, deployment, body) => {
    const containers = body?.spec?.template?.spec?.containers
    return {
      cluster: options.cluster,
      namespace: options.namespace,
      deployment: deployment,
      revision: body?.metadata?.annotations["deployment.kubernetes.io/revision"] ?? null,
      image: (options.container ? containers?.filter(c => c.name == options.container)[0]?.image : containers?.pop(0)?.image) ?? null
    }
  }

  generateFile = async (options) => {
    let newItems = []

    options.deployment = (typeof options.deployment == 'string') ? [options.deployment] : options.deployment

    for await (const deploy of options.deployment) {

      await this.k8s.readNamespacedDeployment(deploy, options.namespace)
        .then(data => {

          const body = data.body

          newItems.push(
            this.buildItem(
              options,
              deploy,
              body
            )
          )

        }).catch(err => {

          newItems.push(
            this.buildItem(
              options,
              deploy,
              null
            )
          )

          const body = err.body
          console.error(
            {
              status: body.status,
              code: body.code,
              reason: body.reason,
              message: body.message,
            }
          )
        }
      )
    }

    if (this.fs.existsSync(options.filename)) {
      const str = this.fs.readFileSync(options.filename, 'utf8')
      
      newItems = parse(str)?.concat(newItems) ?? newItems
    }

    this.fs.writeFile(
      options.filename,
      JSON.stringify(newItems, undefined, 2),
      (err) => { if (err) throw err }
    )
  }
}

module.exports = Rollback
