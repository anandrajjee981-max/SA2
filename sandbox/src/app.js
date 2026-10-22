import express from 'express';
import{v4 as uuidv4} from 'uuid';
const app = express();
import {createpod, waitForPodReady} from './kubernetes/pod.js';
import {createservice, waitForServiceReachable} from './kubernetes/service.js';
import morgan from 'morgan';
app.get('/api/sandbox/health', (req,res)=>{
    res.status(200).json({message: 'ok'})
})
app.use(morgan("dev"))
app.post('/api/sandbox/create', async(req,res)=>{
    const sandboxid = uuidv4();
    const s3Bucket = `sandbox-${sandboxid}`;
    try{
        await createpod(sandboxid, s3Bucket);
        await createservice(sandboxid);
        await waitForPodReady(`sandbox-pod-${sandboxid}`);
        await waitForServiceReachable(`sandbox-service-${sandboxid}`);
        res.status(200).json({
            message: 'sandbox created successfully',
            previewUrl: `http://${sandboxid}.preview.localhost`

        })
    }
    catch(err){
        res.status(500).json({message: 'sandbox creation failed', err: err?.message || String(err)})
    }
})




export default app;
