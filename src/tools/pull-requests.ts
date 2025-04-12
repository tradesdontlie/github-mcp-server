import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as github from "../github-functions/index.js";

/**
 * Register GitHub pull request tools with the MCP server
 */
export function registerPullRequestTools(server: McpServer) {
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
} 