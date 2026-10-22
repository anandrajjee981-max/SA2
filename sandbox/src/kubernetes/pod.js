import { k8sApi } from './config.js';


export const createpod = async (sandboxid, s3Bucket) => {
    const podmanifests = {
        metadata: {
            name: `sandbox-pod-${sandboxid}`,
            labels: {
                app: sandboxid,
            },
        },
        spec: {
            initContainers: [
                {
                    name: `sync-init-${sandboxid}`,
                    image: `sandbox-sync:latest`,
                    imagePullPolicy: "Always",
                    command: ["node", "seed.js"],
                    env: [
                        {
                            name: "SANDBOX_ID",
                            value: sandboxid,
                        },
                        {
                            name: "AWS_ACCESS_KEY_ID",
                            value: process.env.AWS_ACCESS_KEY_ID,
                        },
                        {
                            name: "AWS_SECRET_ACCESS_KEY",
                            value: process.env.AWS_SECRET_ACCESS_KEY,
                        },
                        {
                            name: "AWS_REGION",
                            value: process.env.AWS_REGION,
                        },
                        {
                            name: "S3_BUCKET",
                            value: s3Bucket,
                        },
              
                    ],
                    resources: {
                        limits: {
                            cpu: "500m",
                            memory: "256Mi",
                        },
                        requests: {
                            cpu: "250m",
                            memory: "128Mi",
                        },
                    },
                    volumeMounts: [
                        {
                            name: "code-volume",
                            mountPath: "/workspace",
                        },
                    ],
                },
            ],
            containers: [
                //vite preview
                {
                    name: `sandbox-container-${sandboxid}`,
                    image: 'template:latest',
                    imagePullPolicy: "Always",
                    command: ['npm', 'run', 'dev'],
                    workingDir: "/workspace",
                    ports: [
                        {
                            containerPort: 5173,
                            name: "http",
                        },
                    ],
                    readinessProbe: {
                        tcpSocket: {
                            port: 5173,
                        },
                        initialDelaySeconds: 2,
                        periodSeconds: 3,
                        failureThreshold: 30,
                    },
                    resources: {
                        limits: {
                            cpu: "500m",
                            memory: "256Mi",
                        },
                        requests: {
                            cpu: "250m",
                            memory: "128Mi",
                        },
                    },
                    volumeMounts: [
                        {
                            name: "code-volume",
                            mountPath: "/workspace",
                        },
                    ],


                },
                //comm agent
                {
                    name: `sandbox-agent-${sandboxid}`,
                    image: "sandbox-agent:latest",
                    imagePullPolicy: "Always",
                    env: [
                        {
                            name: "SANDBOX_ID",
                            value: sandboxid,
                        },
                        {
                            name: "AWS_ACCESS_KEY_ID",
                            value: process.env.AWS_ACCESS_KEY_ID,
                        },
                        {
                            name: "AWS_SECRET_ACCESS_KEY",
                            value: process.env.AWS_SECRET_ACCESS_KEY,
                        },
                        {
                            name: "AWS_REGION",
                            value: process.env.AWS_REGION,
                        },
                        {
                            name: "S3_BUCKET",
                            value: s3Bucket,
                        },

                    ],
                    ports: [
                        {
                            containerPort: 3000,
                            name: "agent",
                        },
                    ],
                    readinessProbe: {
                        tcpSocket: {
                            port: 3000,
                        },
                        initialDelaySeconds: 2,
                        periodSeconds: 3,
                        failureThreshold: 30,
                    },
                    resources: {
                        limits: {
                            cpu: "500m",
                            memory: "256Mi",
                        },
                        requests: {
                            cpu: "250m",
                            memory: "128Mi",
                        },
                    },
                    volumeMounts: [
                        {
                            name: "code-volume",
                            mountPath: "/workspace",
                        },
                    ],
                },

            ],
            volumes: [
             {
                    name: "code-volume",
                    emptyDir: {}
                }


            ],


        },
    };

    try{
            const res = await k8sApi.createNamespacedPod({ namespace: "default", body: podmanifests });
            console.log("pod created successfully");
            return res;

        }

    catch(err) {
            console.log("pod creation failed", err);
            throw err;
        }




    }

export const waitForPodReady = async (name, namespace = "default", timeoutMs = 180000) => {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
        try {
            const pod = await k8sApi.readNamespacedPod({ name, namespace });
            const containers = pod.status?.containerStatuses || [];
            const ready = pod.status?.phase === "Running" &&
                containers.length > 0 &&
                containers.every((c) => c.ready);

            if (ready) {
                console.log(`pod ${name} is ready`);
                return pod;
            }

            const failing = containers.find((c) => c.state?.waiting?.reason === "CrashLoopBackOff" || c.state?.terminated);
            if (failing) {
                throw new Error(`container ${failing.name} failed: ${JSON.stringify(failing.state)}`);
            }
        } catch (err) {
            if (err?.code !== 404) {
                console.log("pod status check failed", err.message);
                throw err;
            }
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    throw new Error(`pod ${name} did not become ready within ${timeoutMs}ms`);
}




