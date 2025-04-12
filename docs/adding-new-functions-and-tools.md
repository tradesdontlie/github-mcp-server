# Guide: Adding New Functions and Tools to the MCP Server

This guide provides step-by-step instructions for adding new domain-specific functions and tools to the MCP server that are not related to GitHub.

## Overview

The MCP server follows a modular design with two key concepts:

1. **Domain Functions**: Core functionality that interfaces with external services or implements business logic
2. **MCP Tools**: Wrappers around domain functions that expose them as tools in the MCP server

## File Structure

When adding new functionality, follow this structure:

```
src/
├── domain-functions/     # Domain-specific functions (e.g., weather-functions/)
│   ├── core.ts           # Core functionality for your domain
│   ├── specific-area.ts  # Functions for specific areas within your domain
│   └── index.ts          # Exports all functions from this domain
│
├── tools/                # MCP tools that use domain functions
│   ├── domain.ts         # Tools for your specific domain (e.g., weather.ts)
│   └── index.ts          # Exports all tool registration functions
│
└── main.ts               # Main entry point that registers all tools
```

## Step 1: Create Domain Functions

1. Create a new directory for your domain functions:

   ```bash
   mkdir -p src/your-domain-functions
   ```

2. Create files for your domain functionality:

   - `src/your-domain-functions/core.ts`: Base functionality, types, and service initialization
   - `src/your-domain-functions/specific-area.ts`: Functions for specific features in your domain

3. Create an index file to export all functions:

   ```typescript
   // src/your-domain-functions/index.ts
   export * from './core.js';
   export * from './specific-area.js';
   ```

## Step 2: Implement MCP Tools

1. Create a new file in the tools directory for your domain:

   ```typescript
   // src/tools/your-domain.ts
   import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
   import { z } from "zod";
   import * as domain from "../your-domain-functions/index.js";

   /**
    * Register your domain tools with the MCP server
    */
   export function registerYourDomainTools(server: McpServer) {
     server.tool(
       "yourToolName",
       "Description of your tool",
       {
         param1: z.string(),
         param2: z.number(),
         // Define parameters with Zod schemas
       },
       async ({ param1, param2 }) => {
         // Call your domain function
         const result = await domain.yourFunction(param1, param2);
         
         // Return result in MCP response format
         return {
           content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
         };
       }
     );
     
     // Add more tools as needed
   }
   ```

2. Update the tools index file:

   ```typescript
   // src/tools/index.ts
   export { registerIssueTools } from "./issues.js";
   export { registerPullRequestTools } from "./pull-requests.js";
   export { registerYourDomainTools } from "./your-domain.js";
   ```

## Step 3: Register Tools in the Main File

Update the main.ts file to register your new tools:

```typescript
// src/main.ts
import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import { 
  registerIssueTools, 
  registerPullRequestTools,
  registerYourDomainTools 
} from "./tools/index.js";

// Create an MCP server
const server = new McpServer({
  name: "MCP Server",
  version: "1.0.0",
});

// Register GitHub tools
registerIssueTools(server);
registerPullRequestTools(server);

// Register your domain tools
registerYourDomainTools(server);

// ... rest of the file ...
```

## Step 4: Update Important Files Documentation

Update the `.cursor/rules/important-files.mdc` file to include your new files:

```markdown
# Important Files

- ... existing files ...
- `src/your-domain-functions/core.ts`: Core functionality for your domain
- `src/your-domain-functions/specific-area.ts`: Functions for specific features in your domain
- `src/your-domain-functions/index.ts`: Export file for your domain functions
- `src/tools/your-domain.ts`: MCP server tools for your domain
```

## Best Practices

1. **Separation of Concerns**: Keep domain functions separate from MCP tools
2. **Modular Design**: Group related functionality together
3. **Type Safety**: Use TypeScript types and interfaces for function parameters and return types
4. **Validation**: Use Zod for parameter validation in MCP tools
5. **Documentation**: Add JSDoc comments to describe functions and tools
6. **Error Handling**: Implement proper error handling in domain functions and tools

## Example: Adding Weather Tools

Here's a concrete example of adding weather-related functionality:

### 1. Create Weather Function Files

```typescript
// src/weather-functions/api.ts
export type WeatherParams = {
  location: string;
  units?: 'metric' | 'imperial';
};

export type WeatherData = {
  temperature: number;
  conditions: string;
  location: string;
};

/**
 * Get current weather for a location
 */
export async function getCurrentWeather(params: WeatherParams): Promise<WeatherData> {
  // Implementation to fetch weather data
  // This could call a weather API service
  
  // Example placeholder implementation
  return {
    temperature: 22,
    conditions: "Sunny",
    location: params.location
  };
}
```

```typescript
// src/weather-functions/index.ts
export * from './api.js';
```

### 2. Create Weather Tools

```typescript
// src/tools/weather.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as weather from "../weather-functions/index.js";

export function registerWeatherTools(server: McpServer) {
  server.tool(
    "getCurrentWeather",
    "Get current weather for a location",
    {
      location: z.string(),
      units: z.enum(['metric', 'imperial']).optional(),
    },
    async ({ location, units }) => {
      const data = await weather.getCurrentWeather({ location, units });
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }
  );
}
```

### 3. Update Tools Index

```typescript
// src/tools/index.ts
export { registerIssueTools } from "./issues.js";
export { registerPullRequestTools } from "./pull-requests.js";
export { registerWeatherTools } from "./weather.js";
```

### 4. Register in Main

```typescript
// src/main.ts
import { registerWeatherTools } from "./tools/index.js";

// ...

// Register all tools
registerIssueTools(server);
registerPullRequestTools(server);
registerWeatherTools(server);
```

## Conclusion

Following this approach ensures your code remains modular, maintainable, and follows the established patterns in the MCP server. Each domain has its own functions directory, and MCP tools are neatly organized in the tools directory. 