import * as z from "zod"
import { tool } from "langchain"
import axios from "axios"

const getAgentBaseUrl = () =>
    `http://${process.env.SANDBOX_ID ?? "d2e6828c-a3d7-4f65-a39e-0f46febbf088"}.agent.localhost`

const listfiles = tool(
    async () => {
        console.log("listfile started")
        try {
            const { data } = await axios.get(`${getAgentBaseUrl()}/list-files`)
            return JSON.stringify(data)
        } catch (err) {
            return JSON.stringify(err.response?.data ?? { error: err.message })
        }
    },
    {
        name: "listfiles",
        description: "list files in the sandbox",
        schema: z.object({}),
    }
)

const readfiles = tool(
    async ({ filepath }) => {
        try {
            const paths = Array.isArray(filepath)
                ? filepath
                : String(filepath).split(",").map((file) => file.trim()).filter(Boolean)
            const { data } = await axios.get(`${getAgentBaseUrl()}/read-file`, {
                params: { filepath: paths.join(",") },
            })
            return JSON.stringify(data)
        } catch (err) {
            return JSON.stringify(err.response?.data ?? { error: err.message })
        }
    },
    {
        name: "readfiles",
        description: "read files in the sandbox",
        schema: z.object({
            filepath: z.array(z.string()),
        }),
    }
)

const updatefile = tool(
    async ({ filepath, content }) => {
        try {
            const { data } = await axios.patch(`${getAgentBaseUrl()}/update-files`, {
                files: [{ filepath, content }],
            })
            return JSON.stringify(data)
        } catch (err) {
            return JSON.stringify(err.response?.data ?? { error: err.message })
        }
    },
    {
        name: "updatefile",
        description: "update files in the sandbox",
        schema: z.object({
            filepath: z.string(),
            content: z.string(),
        }),
    }
)

export { listfiles, readfiles, updatefile }
