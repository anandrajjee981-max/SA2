import express from 'express'
import morgan from 'morgan'
import fs from 'fs'
const app = express()
const working_dir = '/workspace'


app.get("/agent/healthy",(req,res)=>{
    res.send("agent started")
})

app.get("/list-files",async(req,res) =>{
try {
    const files = await fs.promises.readdir(working_dir)// why promises because it is async operations and await makes it synchronous
    res.json({files})
} catch (error) {
    res.status(500).json({error:error.message})
}
})

app.get("/read-file",async(req,res) =>{
try {
    const filepath = req.query.filepath
    const fileContent = await fs.readFileSync(filepath,"utf-8")
    res.send(fileContent)
} catch (error) {
    res.status(500).json({error:error.message})
}
})



export default app