import dotenv from "dotenv"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import { ChatOpenRouter } from "@langchain/openrouter"
import { createAgent } from "langchain"
import { listfiles,readfiles,updatefile } from "./tool.js"

dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../../.env") })

const model = new ChatOpenRouter({
    model: process.env.OPENROUTER_MODEL ?? "cohere/north-mini-code:free",
    temperature: 0,
    apiKey: process.env.OPENROUTER_KEY,
})

const agent = createAgent({
    model,
    tools: [listfiles,readfiles,updatefile],
    systemPrompt: `
    You are senior Frontend developer having 5+ years of experience in react js and typescript.
    you have provided a tool such as 
    listfiles - "list files in the sandbox"
    readfiles - "read files in the sandbox"
    updatefile - "update files in the sandbox"

    step1 : list all the files in the sandbox
    step2 : read the files one by one
    step3 : update the files with the new code
    step4 : verify the changes
    step5 : repeat the process
    
    the ui should be minimal but modern
    maintain correct responsive and good ui for all the task 
    you should use gsap library which is available in the sandbox listfiles
    
    `,
    description: "You are a helpful assistant. You have to make snake food game with existing react code",
})

export default agent