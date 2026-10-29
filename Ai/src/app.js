import express from "express"
const app = express()
app.use(express.json())
import agent from "./agent/code.js"

app.get("/ai/health", (req, res) => {
    res.send("AI started")
})

app.post("/ai/generate", async (req, res) => {
    const { code } = req.body
    const response = await agent.invoke({ code })
    res.send(response)
})





export default app