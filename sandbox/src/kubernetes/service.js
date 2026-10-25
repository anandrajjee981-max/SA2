import {k8sApi , k8sNetworking, k8sDiscovery} from './config.js';

export const createservice = async(sandboxid)=>{
    const servicebody = {
        metadata:{
            name: `sandbox-service-${sandboxid}`,
            labels:{
                app: sandboxid,
            },
        },
        spec:{
            selector:{
                app: sandboxid,
            },
            ports:[
                {   
                    name: "http",
                    port: 80,
                    targetPort: 5173,
                    protocol: "TCP",
                },
                {
                    name: "agent",
                    port: 3000,
                    targetPort: 3000,
                    protocol: "TCP",
                },
            ],
            type: "ClusterIP",
        },
    };

    try{
        const res = await k8sApi.createNamespacedService({ namespace: "default", body: servicebody });
        console.log("service created successfully");
        return res;
    }
    catch(err){
        console.log("service creation failed", err);
        throw err;
    }
}


export const waitForServiceReachable = async (serviceName, port = 3000, timeoutMs = 60000, namespace = "default") => {
    const deadline = Date.now() + timeoutMs;
    let lastError = "no attempt made";

    while (Date.now() < deadline) {
        try {
            const slices = await k8sDiscovery.listNamespacedEndpointSlice({
                namespace,
                labelSelector: `kubernetes.io/service-name=${serviceName}`,
            });

            const items = slices.items || [];
            const readyEndpointCount = items.reduce(
                (count, slice) =>
                    count + (slice.endpoints || []).filter((ep) => ep.conditions?.ready !== false).length,
                0
            );
            const exposesPort = items.some((slice) =>
                (slice.ports || []).some((p) => p.port === port)
            );

            if (readyEndpointCount > 0 && exposesPort) {
                console.log(`service ${serviceName} is reachable (${readyEndpointCount} ready endpoint(s) on port ${port})`);
                return;
            }

            lastError = `no ready endpoints on port ${port}`;
        } catch (err) {
            lastError = err.message;
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    throw new Error(`service ${serviceName} is not reachable within ${timeoutMs}ms (${lastError})`);
}

export const createingress = async(sandboxid) =>{
 const previewhost = `${sandboxid}-preview.localhost`
 const agenthost = `${sandboxid}-agent.localhost`
const ingressmanifest = {
    metadata:{
        name: `sandbox-ingress-${sandboxid}`,
        annotations:{
              "nginx.ingress.kubernetes.io/proxy-read-timeout": "3600",
                "nginx.ingress.kubernetes.io/proxy-send-timeout": "3600",
                "nginx.ingress.kubernetes.io/proxy-http-version": "1.1",
        }
    },  
    spec:{
     ingressClassName: "nginx",
     rules:[{
        host: previewhost,
        http:{
            paths:[
                {
                    path: '/',
                    pathType: 'Prefix',
                    backend:{
                        service:{
                            name: `sandbox-service-${sandboxid}`,
                            port:{
                                number: 3000,
                            },
                        },
                    },
                },
            ],
        },
     },{
        host: agenthost,
        http:{
            paths:[
                {
                    path: '/',
                    pathType: 'Prefix',
                    backend:{
                        service:{
                            name: `sandbox-service-${sandboxid}`,
                            port:{
                                number: 3000,
                            },
                        },
                    },
                },
            ],
        },
     }],
    },
};

try{
    const res = await k8sNetworking.createNamespacedIngress({ namespace: "default", body: ingressmanifest });
    console.log("ingress created successfully");
    return res;
}
catch(err){
    console.log("ingress creation failed", err);
    throw err;
}

}
