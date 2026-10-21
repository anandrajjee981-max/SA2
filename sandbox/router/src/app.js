import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
const app = express();
app.use((req, res, next) => {
const host = req.headers.host;
const sandboxid = host.split(".")[0];
const target = `http://sandbox-service-${sandboxid}`;
  return createProxyMiddleware({
    target: target,
    changeOrigin: true, 
    ws: true,

});(req, res, next);
})
app.get("/router/health", (req, res) => {
  res.send("Router is healthy");
});

export default app;