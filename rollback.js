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
      .requiredOption('-d, --deployment <string>', 'Kubernetes deployment name.')
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

  generateFile = async (options) => {
    const res = await this.k8s.readNamespacedDeployment(options.deployment, options.namespace)

    const containers = res.body.spec.template.spec.containers

    const item = {
      cluster: options.cluster,
      namespace: options.namespace,
      deployment: options.deployment,
      revision: res.body.metadata.annotations["deployment.kubernetes.io/revision"],
      image: ((options.container) ? containers.filter(c => c.name == options.container)[0]?.image : containers[0].image) ?? null
    }

    let listItems = []

    if (this.fs.existsSync(options.filename)) {
      const str = this.fs.readFileSync(options.filename, 'utf8')

      listItems = parse(str) ?? listItems
    }
    
    listItems.push(item)

    this.fs.writeFile(
      options.filename,
      JSON.stringify(listItems, undefined, 2),
      (err) => { if (err) throw err }
    )
  }
}

module.exports = Rollback
