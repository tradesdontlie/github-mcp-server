import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import { registerIssueTools, registerPullRequestTools, registerTaskTools } from "./tools/index.js";

// Create an MCP server
const server = new McpServer({
  name: "GitHub MCP Server",
  version: "1.0.0",
});

// Register tools
registerIssueTools(server);
registerPullRequestTools(server);
registerTaskTools(server);

// Create Express app
const app = express();
let transport: SSEServerTransport | undefined = undefined;

// Set up SSE endpoint
app.get("/sse", async (req, res) => {
  transport = new SSEServerTransport("/messages", res);
  await server.connect(transport);
});

// Set up messages endpoint for communication
app.post("/messages", async (req, res) => {
  if (!transport) {
    res.status(400);
    res.json({ error: "No transport" });
    return;
  }
  await transport.handlePostMessage(req, res);
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`MCP Server is running on port ${PORT}`);
  console.log(`Connect to SSE endpoint at http://localhost:${PORT}/sse`);
}); 