import express from 'express'
import morgan from 'morgan'
import fs from 'fs'
import path from 'path'
const app = express()
app.use(express.json())
const working_dir = '/workspace'


app.get("/agent/healthy",(req,res)=>{
    res.send("agent started")
})
/**
 * Lists all files and directories in the workspace. except node_modules , .git , dist 
 * 
 * Request:
 * GET /list-files
 * 
 * Response (Success):
 * {
 *   "files": [
 *     "file1.txt",
 *     "folder1",
 *     "folder2"
 *   ]
 * }
 * 
 * Response (Error):
 * {
 *   "error": "Error message"
 * }
 * 
 * Error Handling:
 * - Returns 500 if the workspace directory cannot be read.
 */

app.get("/list-files",async(req,res) =>{
try {
    const entries = await fs.promises.readdir(working_dir, { recursive: true, withFileTypes: true });
    const ignored = new Set(["node_modules", ".git", "dist", "package.json", "package-lock.json"]);

    const files = entries
        .filter((entry) => entry.isFile())
        .map((entry) => path.relative(working_dir, path.join(entry.parentPath ?? entry.path, entry.name)).split(path.sep).join("/"))
        .filter((file) => !file.split("/").some((part) => ignored.has(part)));

    res.json({ files });
} catch (error) {
    res.status(500).json({error:error.message})
}
})
/**
 * Reads files from the workspace.
 * Supports reading multiple files by providing a comma-separated list of file paths.
 * 
 * Query Parameters:
 * - filepath: A comma-separated string of file paths to read (e.g., "file1.txt,folder/file2.txt").
 * 
 * Request:
 * GET /read-file?filepath=path/to/file1.txt,path/to/file2.txt
 * 
 * Response (Success):
 * {
 *   "files": [
 *     {
 *       "file1.txt": "Content of file1.txt"
 *     },
 *     {
 *       "folder/file2.txt": "Content of file2.txt"
 *     }
 *   ]
 * }
 * 
 * Response (Error):
 * {
 *   "error": "Error message"
 * }
 * 
 * Error Handling:
 * - Returns 400 if 'filepath' query parameter is missing.
 * - Returns 500 if any file cannot be read or other server errors occur.
 */


app.get("/read-file",async(req,res) =>{
try {
    const filepath = req.query.filepath
if(!filepath) return res.status(400).json({error:"missing filepath"})
    const filelist = filepath.split(",")

const result = await Promise.all(filelist.map(async(file) =>{
    const filepath = path.join(working_dir,file)
    if(!filepath)return{
        [file]:"missing filepath"
    }
    const data = await fs.promises.readFile(filepath,"utf-8")
    return {
        [file]:data
    }


}))
res.status(200).json({result})


} catch (error) {
    res.status(500).json({error:error.message})
}
})
/**
 * creates a file if it does not exist or updates its content if it already exists.
 * The endpoint accepts JSON in the request body with the following properties:
 * body{
 *  "files":[
 * {
 *   "filepath": "path/to/file.txt",
 *   "content": "file content"
 * },
 * {
 *    "filename": "path/to/file.txt",
 *   "content": "file content"
 * }
 * 
 * ]
 * 
 * 
 * }
 *
 */

app.post("/create-file",async(req , res)=>{
try {
 const {files} = req.body
 console.log(files)
 if(!files || !Array.isArray(files))
    return res.status(400).json({error:"missing files"})
  if(files.some((file) => !file.filepath || file.content === undefined))
    return res.status(400).json({error:"missing filepath or content"})

  const result =   await Promise.all(files.map(async(file)=>{
    const filepath = path.join(working_dir,file.filepath)
    const content = file.content
    await fs.promises.mkdir(path.dirname(filepath), { recursive: true });
    await fs.promises.writeFile(filepath,content,"utf-8")
return {
    [filepath]:"success"
}


    }) )
    res.status(200).json({result})
  
} catch (error) {
    console.log(error)
    res.status(500).json({error:error.message})
}
})
/**
 * Updates files in the workspace. The endpoint accepts JSON in the request body with the following properties:
 * body{
 *  "file":[
 * {
 *   "filepath": "path/to/file.txt",
 *   "content": "file content"
 * },
 * {
 *    "filename": "path/to/file.txt",
 *   "content": "file content"
 * }
 * 
 * ]
 * 
 * 
 * }
 * 
 * 
 */
app.patch("/update-files",async(req,res)=>{
try {
    const {files} = req.body
    console.log("received update files request")
    
    console.log(files)
    if(!files || !Array.isArray(files))
        return res.status(400).json({error:"missing files"})
    if(files.some((file) => !file.filepath || file.content === undefined))
        return res.status(400).json({error:"missing filepath or content"})
    

    const result =  await Promise.all(files.map(async(file)=>{
        const filepath = path.join(working_dir,file.filepath)
        const content = file.content
        await fs.promises.mkdir(path.dirname(filepath), { recursive: true });
        await fs.promises.writeFile(filepath,content,"utf-8")
    return {
        [filepath]:"success"
    }


    }) )  
    res.status(200).json({result})

} catch (error) {
    console.log(error)
    res.status(500).json({error:error.message})
}
})






export default app