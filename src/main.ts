import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import { z } from "zod";
import * as github from "./github.js";

// Create an MCP server
const server = new McpServer({
  name: "GitHub MCP Server",
  version: "1.0.0",
});

// GitHub Issue Tools
server.tool(
  "getIssue",
  "Get an issue by number",
  {
    owner: z.string(),
    repo: z.string(),
    issueNumber: z.number(),
  },
  async ({ owner, repo, issueNumber }) => {
    const issue = await github.getIssue({ owner, repo }, issueNumber);
    return {
      content: [{ type: "text", text: JSON.stringify(issue, null, 2) }],
    };
  }
);

server.tool(
  "createIssueComment",
  "Create a comment on an issue",
  {
    owner: z.string(),
    repo: z.string(),
    issueNumber: z.number(),
    body: z.string(),
  },
  async ({ owner, repo, issueNumber, body }) => {
    const comment = await github.createIssueComment(
      { owner, repo },
      issueNumber,
      body
    );
    return {
      content: [{ type: "text", text: JSON.stringify(comment, null, 2) }],
    };
  }
);

server.tool(
  "updateIssue",
  "Update an issue",
  {
    owner: z.string(),
    repo: z.string(),
    issueNumber: z.number(),
    title: z.string().optional(),
    body: z.string().optional(),
    state: z.enum(["open", "closed"]).optional(),
    labels: z.array(z.string()).optional(),
    assignees: z.array(z.string()).optional(),
  },
  async ({ owner, repo, issueNumber, ...updates }) => {
    const issue = await github.updateIssue(
      { owner, repo },
      issueNumber,
      updates
    );
    return {
      content: [{ type: "text", text: JSON.stringify(issue, null, 2) }],
    };
  }
);

server.tool(
  "listIssues",
  "List issues for a repository",
  {
    owner: z.string(),
    repo: z.string(),
    state: z.enum(["open", "closed", "all"]).optional(),
    labels: z.string().optional(),
    sort: z.enum(["created", "updated", "comments"]).optional(),
    direction: z.enum(["asc", "desc"]).optional(),
    per_page: z.number().optional(),
    page: z.number().optional(),
  },
  async ({ owner, repo, ...options }) => {
    const issues = await github.listIssues({ owner, repo }, options);
    return {
      content: [{ type: "text", text: JSON.stringify(issues, null, 2) }],
    };
  }
);

// GitHub Pull Request Tools
server.tool(
  "getPullRequest",
  "Get a pull request by number",
  {
    owner: z.string(),
    repo: z.string(),
    pullNumber: z.number(),
  },
  async ({ owner, repo, pullNumber }) => {
    const pr = await github.getPullRequest({ owner, repo }, pullNumber);
    return {
      content: [{ type: "text", text: JSON.stringify(pr, null, 2) }],
    };
  }
);

server.tool(
  "createPullRequestComment",
  "Create a comment on a pull request",
  {
    owner: z.string(),
    repo: z.string(),
    pullNumber: z.number(),
    body: z.string(),
  },
  async ({ owner, repo, pullNumber, body }) => {
    const comment = await github.createPullRequestComment(
      { owner, repo },
      pullNumber,
      body
    );
    return {
      content: [{ type: "text", text: JSON.stringify(comment, null, 2) }],
    };
  }
);

server.tool(
  "updatePullRequest",
  "Update a pull request",
  {
    owner: z.string(),
    repo: z.string(),
    pullNumber: z.number(),
    title: z.string().optional(),
    body: z.string().optional(),
    state: z.enum(["open", "closed"]).optional(),
  },
  async ({ owner, repo, pullNumber, ...updates }) => {
    const pr = await github.updatePullRequest(
      { owner, repo },
      pullNumber,
      updates
    );
    return {
      content: [{ type: "text", text: JSON.stringify(pr, null, 2) }],
    };
  }
);

server.tool(
  "listPullRequests",
  "List pull requests for a repository",
  {
    owner: z.string(),
    repo: z.string(),
    state: z.enum(["open", "closed", "all"]).optional(),
    sort: z.enum(["created", "updated", "popularity", "long-running"]).optional(),
    direction: z.enum(["asc", "desc"]).optional(),
    per_page: z.number().optional(),
    page: z.number().optional(),
  },
  async ({ owner, repo, ...options }) => {
    const prs = await github.listPullRequests({ owner, repo }, options);
    return {
      content: [{ type: "text", text: JSON.stringify(prs, null, 2) }],
    };
  }
);

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