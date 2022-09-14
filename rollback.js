const { Command, Option } = require('commander')
const { parseYaml } = require('./common/utils')
const { getFiles } = require('./common/file-utils')
const Logger = require('./common/logger')

const logger = new Logger()

class Rollback {
  constructor(k8s) {
    this.k8s = k8s
  }

  buildCommand = () => {
    const cmd = new Command('rollback')

    cmd
      .command('generate-file')
      .requiredOption('-n, --namespace <string>', 'Kubernetes namespace.')
      .option('-c, --container <string>', 'Kubernetes container name.')
      .option('-d, --deployment <string...>', 'Kubernetes deployment names.')
      .addOption(new Option('-f, --deployment-files <string>', 'Path of kubernetes yml files.').conflicts('deployment'))

    cmd
      .command('exec')
      .option('-n, --namespace <string>', 'Kubernetes namespace.')
      .option('-d, --deployment <string>', 'Kubernetes deployment name.')
      .option('-r, --revision <string>', 'Kubernetes revision id.')
      .addOption(new Option('-f, --rollback-files <string>', 'Rollback file.').conflicts(['namespace', 'deployment', 'revision']))

    cmd
      .option('--error', 'output log error')

    return cmd
  }

  getGenerateFile = (commands) => commands.filter(i => i.name() == "generate-file")[0]
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
    let deploymentNames = ((typeof options?.deployment == 'string') ? [options.deployment] : options?.deployment) ?? []
    const path = options.deploymentFiles

    if (path) {
      getFiles(path, '.yml', '.yaml')?.forEach(file => {
        parseYaml(file)?.forEach(yml => {
          if (yml.kind == 'Deployment') {
            deploymentNames.push(yml.metadata.name)
          }
        })
      })
    }

    for (const deploy of deploymentNames) {

      await this.k8s.readNamespacedDeployment(deploy, options.namespace)
        .then(data => newItems.push(this.buildItem(options, deploy, data.body)))
        .catch(
          err => {
            newItems.push(this.buildItem(options, deploy, null))

            const body = err.body
            logger.error(
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

    const data = JSON.stringify(newItems, undefined, 2)
    process.stdout.write(data + '\n')
  }
}

module.exports = Rollback
