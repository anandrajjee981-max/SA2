import express from "express"
const app = express()
app.use(express.json())


app.get("/ai/health",(req,res)=>{
    res.send("AI started")
})





export default app