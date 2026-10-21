import express from 'express';
import morgan from 'morgan';

import { createService } from './kubernetes/service.js';
import { createPod } from './kubernetes/pod.js';
import { v7 as uuid } from 'uuid';

const app = express();
app.use(express.json());

app.use(morgan('dev'));


app.get('/api/sandbox/health', (req, res) => {
    res.status(200).json({ message: 'Sandbox service is healthy' });
});
app.post('/api/sandbox/create', async (req, res) => {
    const sandboxId = uuid();
    try {
        await createPod(sandboxId, process.env.S3_BUCKET);
        await createService(sandboxId);
        res.status(201).json({ message: 'Sandbox created successfully', sandboxId ,previewUrl: `http://${sandboxId}.preview.localhost`});
    } catch (error) {
        console.error('Error creating sandbox:', error);
        res.status(500).json({ message: 'Error creating sandbox', error: error.message });
    }
});



export default app;