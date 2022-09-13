const commander = require('commander')

class Scale {
  constructor(k8s) {
    this.k8s = k8s
  }

  buildCommand = () => {
    const cmd = new commander.Command('scale')

    cmd
      .command('up')
      .requiredOption('-n, --namespace <string>', 'Kubernetes namespace.')
      .requiredOption('-d, --deployment <string>', 'Kubernetes deployment name.')
      .requiredOption('-r, --replicas <string>', 'Number of replicas.')

    return cmd
  }

  scale = async (namespace, deploymentName, replicas) => {
    const res = await this.k8s.readNamespacedDeployment(deploymentName, namespace)
    const deployment = res.body

    deployment.spec.replicas = replicas

    await this.k8s.replaceNamespacedDeployment(deploymentName, namespace, deployment)
  }
}

module.exports = Scale
