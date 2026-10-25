import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'

const app = express()

app.get('/router/health', (req, res) => {
    res.send('req is healthy ')
})

const proxies = {}
const agentProxies ={}

function getproxies(sandboxid){
    if (!proxies[sandboxid]) {
        proxies[sandboxid] = createProxyMiddleware({
            target: `http://sandbox-service-${sandboxid}:80`,
            changeOrigin: true,
            ws: true,
          
        })
    }
    return proxies[sandboxid]
}
function getagentproxies(sandboxid){
    if (!agentProxies[sandboxid]) {
        agentProxies[sandboxid] = createProxyMiddleware({
            target: `http://sandbox-service-${sandboxid}:3000`,
            changeOrigin: true,
            ws: true,
        
        })
    }
    return agentProxies[sandboxid]
}

app.use((req, res, next) => {
    const host = req.headers.host || ''
    const [firstLabel, secondLabel] = host.split('.')

    if (secondLabel === 'agent' || firstLabel.endsWith('-agent')) {
        const sandboxid = secondLabel === 'agent'
            ? firstLabel
            : firstLabel.slice(0, -'-agent'.length)
        return getagentproxies(sandboxid)(req, res, next)
    }

    return getproxies(firstLabel)(req, res, next)
})

export default app
