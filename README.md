# GitHub MCP Server

A Model Context Protocol (MCP) server that provides tools for managing GitHub repositories and task management.

## Features

### GitHub Integration
- Create and manage issues
- Handle pull requests
- Work with repositories

### Task Management
- Create and organize tasks with priorities
- Track dependencies between tasks
- Mark tasks as complete
- Get the next highest priority task to work on

## Recent Updates
- Fixed dependency handling in the getNextTask function
- Improved task parsing for better reliability
- Added robust error handling

## Setup
1. Clone this repository
2. Install dependencies with `npm install` or `pnpm install`
3. Set up your GitHub token in the `.env` file
4. Run the server with `npm start`

## Documentation
See the `docs` directory for detailed information on each feature.