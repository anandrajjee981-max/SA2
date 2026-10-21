import * as k8s from "@kubernetes/client-node";


const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const currentCluster = kc.getCurrentCluster();
console.log(`Kubernetes API server: ${currentCluster?.server}`);

if (currentCluster?.server?.startsWith("http:")) {
    currentCluster.skipTLSVerify = true;
}

const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
const k8sNetworkingApi = kc.makeApiClient(k8s.NetworkingV1Api);

export { k8sApi, k8sNetworkingApi };