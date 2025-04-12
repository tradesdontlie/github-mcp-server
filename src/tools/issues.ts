import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as github from "../github-functions/index.js";

/**
 * Register GitHub issue tools with the MCP server
 */
export function registerIssueTools(server: McpServer) {
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
} 