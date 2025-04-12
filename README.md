# GitHub MCP Server

A Model Context Protocol (MCP) server for GitHub integrations, built with TypeScript and Express.

## Features

- SSE (Server-Sent Events) transport for real-time communication
- GitHub API integration using Octokit
- Tool support for GitHub issues and pull requests

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (or npm/yarn)
- GitHub Personal Access Token

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/github-mcp-server.git
cd github-mcp-server
```

2. Install dependencies
```bash
pnpm install
```

3. Set up environment variables
Create a `.env` file in the root directory:
```
GITHUB_TOKEN=your_github_personal_access_token
PORT=8080
```

### Running the Server

Development mode:
```bash
pnpm dev
```

Build and run in production:
```bash
pnpm build
pnpm start
```

## Usage

Connect to the SSE endpoint at `http://localhost:8080/sse` to establish a connection.
Send messages to `http://localhost:8080/messages`.

## Available Tools

- GitHub Issues: `getIssue`, `createIssueComment`, `updateIssue`, `listIssues`
- GitHub Pull Requests: `getPullRequest`, `createPullRequestComment`, `updatePullRequest`, `listPullRequests`

## License

MIT

## Acknowledgments

Built with [Model Context Protocol SDK](https://github.com/modelcontextprotocol/sdk) 