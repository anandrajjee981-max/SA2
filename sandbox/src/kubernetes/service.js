import {k8sApi , k8sNetworking} from './config.js';

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
                    port: 3000,
                    targetPort: 5173,
                    name: "http",
                },
            ],
            type: "LoadBalancer",
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


export const waitForServiceReachable = async (serviceName, port = 3000, timeoutMs = 60000) => {
    const deadline = Date.now() + timeoutMs;
    let lastError = "no attempt made";

    while (Date.now() < deadline) {
        try {
            const res = await fetch(`http://${serviceName}:${port}/`, {
                signal: AbortSignal.timeout(3000),
            });

            if (res.status < 500) {
                console.log(`service ${serviceName} is reachable (status ${res.status})`);
                return;
            }

            lastError = `status ${res.status}`;
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
