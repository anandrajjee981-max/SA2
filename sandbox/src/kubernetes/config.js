import * as k8s from '@kubernetes/client-node';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const Currentcluster = kc.getCluster();
console.log("Kubernetes cluster details:", Currentcluster);

if (Currentcluster?.server?.startsWith("https")) {
  Currentcluster.skipTLSVerify = true;
}

const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
const k8sNetworking = kc.makeApiClient(k8s.NetworkingV1Api);

export  {k8sApi,k8sNetworking}