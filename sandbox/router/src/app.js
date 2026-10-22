import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'

const app = express()

app.get('/router/health', (req, res) => {
    res.send('req is healthy ')
})

const proxies = new Map()

const proxyFor = (sandboxid) => {
    if (!proxies.has(sandboxid)) {
        proxies.set(sandboxid, createProxyMiddleware({
            target: `http://sandbox-service-${sandboxid}:3000`,
            changeOrigin: true,
            ws: true,
            proxyTimeout: 3600000,
            timeout: 3600000,
        }))
    }
    return proxies.get(sandboxid)
}

app.use((req, res, next) => {
    const host = req.headers.host || ''
    const sandboxid = host.split('.')[0]
    if (!sandboxid) {
        return res.status(400).json({ message: 'missing sandbox id in host' })
    }
    return proxyFor(sandboxid)(req, res, next)
})

export default app
