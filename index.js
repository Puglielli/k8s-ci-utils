const fs = require('fs')
const commander = require('commander')
const k8s = require('@kubernetes/client-node')

commander
.usage('<argument> [options]')
.argument('generate-rollback', 'Gera o arquivo de rollback')
.option('-n, --namespace <string>', 'Kubernetes namespace.')
.option('-d, --deployment <string>', 'Kubernetes deployment name.')
.option('-f, --filename <string>', 'Rollback file name.')
.version('1.0.0', '-v, --version')
.parse(process.argv)

const options = commander.opts()

const validOptions = (...keys) => {
  const optionsNotFound = keys.filter(key => options[key] == undefined)

  if (optionsNotFound.length > 0) throw new Error(`The following flags were not passed: --${optionsNotFound.join(' --')}`)
}


// Kubernetes-client Apis > [App, Core]
const kc = new k8s.KubeConfig()
kc.loadFromDefault()
const k8sApp = kc.makeApiClient(k8s.AppsV1Api)
const k8sCore = kc.makeApiClient(k8s.CoreV1Api)


async function scale(namespace, name, replicas) {
  const res = await k8sApp.readNamespacedDeployment(name, namespace)
  const deployment = res.body

  deployment.spec.replicas = replicas

  await k8sApp.replaceNamespacedDeployment(name, namespace, deployment)
}

// scale(options.namespace, options.deployment, options.replicas)


async function getRevisionAndImage(namespace, name, containerName = undefined, filename) {
  const res = await k8sApp.readNamespacedDeployment(name, namespace)

  const containers = res.body.spec.template.spec.containers

  const itens = {
    cluster: kc.getCurrentContext(),
    namespace: namespace,
    revision: res.body.metadata.annotations["deployment.kubernetes.io/revision"],
    image: (containerName == undefined) ? containers[0].image : containers.filter(c => c.name == containerName)[0].image
  }

  fs.writeFile(
    filename,
    JSON.stringify(itens, undefined, 2),
    (err) => { if (err) throw err }
  )
}


validOptions('namespace', 'deployment', 'filename')
getRevisionAndImage(options.namespace, options.deployment, undefined, options.filename)
