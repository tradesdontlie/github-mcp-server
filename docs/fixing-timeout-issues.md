# Step-by-Step Guide to Fixing Timeout Issues

This document provides a comprehensive guide for resolving the timeout issues in the GitHub MCP Server. Follow these steps in sequence for best results.

## Table of Contents
1. [Configure Express Server Timeouts](#1-configure-express-server-timeouts)
2. [Improve SSE Transport Error Handling](#2-improve-sse-transport-error-handling)
3. [Implement File Caching](#3-implement-file-caching)
4. [Optimize Task Parsing](#4-optimize-task-parsing)
5. [Add Comprehensive Error Handling](#5-add-comprehensive-error-handling)
6. [Implement Tool Timeouts](#6-implement-tool-timeouts)
7. [Add Progress Indicators](#7-add-progress-indicators)
8. [Optimize Memory Usage](#8-optimize-memory-usage)
9. [Testing Recommendations](#9-testing-recommendations)

## 1. Configure Express Server Timeouts

### Issue
Default Express timeout settings are too short for complex file operations.

### Fix
```typescript
// In src/main.ts

// Import the required modules
import express from "express";
import timeout from "connect-timeout";

const app = express();

// Set a global timeout of 60 seconds
app.use(timeout("60s"));

// Add timeout handler middleware
app.use((req, res, next) => {
  if (!req.timedout) next();
});

// Add timeout error handler
app.use((err, req, res, next) => {
  if (err.timeout) {
    res.status(408).json({ error: "Request timeout" });
  } else {
    next(err);
  }
});
```

### Implementation Steps
1. Install required package: `npm install connect-timeout`
2. Update the Express app configuration in `src/main.ts`
3. Add the timeout middleware before your routes
4. Add the error handling middleware after your routes

## 2. Improve SSE Transport Error Handling

### Issue
SSE transport lacks explicit timeout settings and error handling.

### Fix
```typescript
// In src/main.ts

app.get("/sse", async (req, res) => {
  // Set headers for SSE
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Content-Type', 'text/event-stream');
  
  // Set a longer timeout for SSE connections
  req.socket.setTimeout(5 * 60 * 1000); // 5 minutes
  
  // Create transport with error handling
  try {
    transport = new SSEServerTransport("/messages", res);
    
    // Handle client disconnect
    req.on('close', () => {
      console.log('SSE Client disconnected');
      // Clean up resources if needed
    });
    
    await server.connect(transport);
  } catch (error) {
    console.error('SSE connection error:', error);
    res.end();
  }
});
```

### Implementation Steps
1. Update the SSE endpoint in `src/main.ts`
2. Add appropriate headers for SSE connections
3. Set longer socket timeout for SSE connections
4. Implement error handling and cleanup logic

## 3. Implement File Caching

### Issue
Each task operation reads the entire file from disk, causing inefficiency.

### Fix
```typescript
// Create a new file: src/task-functions/cache.ts

import type { Task } from './core.js';
import fs from 'fs-extra';
import { parseTasks } from './task-manager.js';

// Cache structure
interface TaskCache {
  tasks: Task[];
  lastUpdated: number;
  filePath: string;
  isDirty: boolean;
}

// Global cache object
const taskCaches: Record<string, TaskCache> = {};

// Cache expiration time (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000;

/**
 * Get tasks from cache or load from file
 */
export async function getTasksWithCache(taskFilePath: string): Promise<Task[]> {
  const now = Date.now();
  
  // Check if cache exists and is valid
  if (
    taskCaches[taskFilePath] && 
    (now - taskCaches[taskFilePath].lastUpdated < CACHE_EXPIRATION)
  ) {
    return taskCaches[taskFilePath].tasks;
  }
  
  // Load from file
  const tasks = await parseTasks(taskFilePath);
  
  // Update cache
  taskCaches[taskFilePath] = {
    tasks,
    lastUpdated: now,
    filePath: taskFilePath,
    isDirty: false
  };
  
  return tasks;
}

/**
 * Update task in cache
 */
export function updateTaskInCache(taskFilePath: string, updatedTask: Task): void {
  if (!taskCaches[taskFilePath]) return;
  
  const cache = taskCaches[taskFilePath];
  const taskIndex = cache.tasks.findIndex(t => t.id === updatedTask.id);
  
  if (taskIndex !== -1) {
    cache.tasks[taskIndex] = updatedTask;
    cache.isDirty = true;
  }
}

/**
 * Add task to cache
 */
export function addTaskToCache(taskFilePath: string, newTask: Task): void {
  if (!taskCaches[taskFilePath]) {
    taskCaches[taskFilePath] = {
      tasks: [newTask],
      lastUpdated: Date.now(),
      filePath: taskFilePath,
      isDirty: true
    };
  } else {
    taskCaches[taskFilePath].tasks.push(newTask);
    taskCaches[taskFilePath].isDirty = true;
  }
}

/**
 * Save cache to disk if dirty
 */
export async function persistCache(taskFilePath: string): Promise<void> {
  const cache = taskCaches[taskFilePath];
  if (!cache || !cache.isDirty) return;
  
  try {
    // Implementation details for saving to disk
    // This would replace the current file writing logic
    // ...
    
    cache.isDirty = false;
    cache.lastUpdated = Date.now();
  } catch (error) {
    console.error('Error persisting cache:', error);
    throw error;
  }
}
```

### Implementation Steps
1. Create the cache module in `src/task-functions/cache.ts`
2. Modify task functions to use the cache instead of direct file operations
3. Add scheduled cache persistence (e.g., every minute)
4. Update the export in `index.ts` to include the cache functions

## 4. Optimize Task Parsing

### Issue
Complex regex pattern is used repeatedly and could be slow on large files.

### Fix
```typescript
// In src/task-functions/task-manager.ts

/**
 * Parse the Markdown file and extract all tasks more efficiently
 */
export async function parseTasks(taskFilePath: string = DEFAULT_TASK_FILE_PATH): Promise<Task[]> {
  if (!(await fs.pathExists(taskFilePath))) {
    return [];
  }

  const content = await fs.readFile(taskFilePath, 'utf-8');
  const tasks: Task[] = [];
  
  // Split the file by task blocks first (more efficient for large files)
  const taskBlocks = content.split(/\n\n- \[/).slice(1);
  
  for (const block of taskBlocks) {
    // Process each block with simpler regex patterns
    if (!block.trim()) continue;
    
    const fullBlock = `- [${block}`;
    const isCompleted = fullBlock.startsWith('- [x]');
    
    // Extract title
    const titleMatch = fullBlock.match(/\*\*(.*?)\*\*/);
    if (!titleMatch) continue;
    const title = titleMatch[1];
    
    // Extract ID
    const idMatch = fullBlock.match(/\`\(ID: ([\w-_]+)\)\`/);
    if (!idMatch) continue;
    const id = idMatch[1];
    
    // Extract priority
    const priorityMatch = fullBlock.match(/\*\*Priority:\*\* \`(high|medium|low)\`/);
    if (!priorityMatch) continue;
    const priority = priorityMatch[1];
    
    // Extract dependencies
    const dependenciesMatch = fullBlock.match(/\*\*Dependencies:\*\* \`(.*?)\`/);
    if (!dependenciesMatch) continue;
    const dependencies = dependenciesMatch[1] === 'None' 
      ? []
      : dependenciesMatch[1].split(',').map(d => d.trim()).filter(d => d !== '');
    
    // Extract created date
    const createdMatch = fullBlock.match(/\*\*Created:\*\* \`(.*?)\`/);
    if (!createdMatch) continue;
    const created = createdMatch[1];
    
    // Extract description
    const descriptionMatch = fullBlock.match(/\*\*Description:\*\*\s+```\s+([\s\S]*?)```/);
    if (!descriptionMatch) continue;
    const description = descriptionMatch[1].trim();
    
    tasks.push({
      id,
      title,
      isCompleted,
      priority: priority as TaskPriority,
      dependencies,
      created,
      description
    });
  }
  
  return tasks;
}
```

### Implementation Steps
1. Update the `parseTasks` function in `src/task-functions/task-manager.ts`
2. Test with large task files to verify performance improvement
3. Consider adding a streaming parser for very large files if needed

## 5. Add Comprehensive Error Handling

### Issue
Many async operations lack proper try/catch blocks and error responses.

### Fix
```typescript
// Example for task-manager.ts functions

/**
 * Get the highest priority uncompleted task with all dependencies completed
 * with improved error handling
 */
export async function getNextTask(taskFilePath: string = DEFAULT_TASK_FILE_PATH): Promise<Task | null> {
  try {
    const tasks = await getTasksWithCache(taskFilePath);
    
    // Rest of function implementation...
    // ...
    
    return sortedTasks[0] || null;
  } catch (error) {
    console.error('Error in getNextTask:', error);
    // Rethrow with a more informative message
    throw new Error(`Failed to get next task: ${error.message}`);
  }
}
```

### Implementation Steps
1. Add try/catch blocks to all async functions
2. Log detailed error information
3. Consider adding custom error classes for different types of errors
4. Update tools to properly handle and respond to errors

## 6. Implement Tool Timeouts

### Issue
No timeout handling in tool implementations for long-running operations.

### Fix
```typescript
// In src/tools/tasks.ts

import { promiseWithTimeout } from '../utils/promise-utils.js';

// Add this utility in src/utils/promise-utils.ts
// 
// export async function promiseWithTimeout<T>(
//   promise: Promise<T>,
//   timeoutMs: number,
//   timeoutError = new Error('Operation timed out')
// ): Promise<T> {
//   let timeoutId: NodeJS.Timeout;
//   
//   const timeoutPromise = new Promise<never>((_, reject) => {
//     timeoutId = setTimeout(() => reject(timeoutError), timeoutMs);
//   });
//   
//   return Promise.race([
//     promise,
//     timeoutPromise
//   ]).finally(() => {
//     clearTimeout(timeoutId);
//   });
// }

// Then use in tools:
server.tool(
  "getNextTask",
  "Get the highest priority uncompleted task with all dependencies completed",
  {
    taskFilePath: z.string().optional(),
  },
  async ({ taskFilePath }) => {
    try {
      // Apply timeout of 10 seconds
      const nextTask = await promiseWithTimeout(
        taskFunctions.getNextTask(taskFilePath),
        10000,
        new Error("Getting next task timed out")
      );
      
      // Rest of function...
      
    } catch (error) {
      console.error("Error in getNextTask tool:", error);
      return {
        content: [{ 
          type: "text", 
          text: `Error getting next task: ${error.message}` 
        }],
      };
    }
  }
);
```

### Implementation Steps
1. Create a utility for handling promise timeouts
2. Apply the timeout utility to long-running operations in tools
3. Provide graceful error responses when timeouts occur

## 7. Add Progress Indicators

### Issue
No progress indicators for long-running operations.

### Fix
```typescript
// In tools implementation

server.tool(
  "createTask",
  "Create a new task and add it to the task file",
  {
    title: z.string(),
    description: z.string(),
    priority: z.enum(["high", "medium", "low"]).optional(),
    dependencies: z.array(z.string()).optional(),
    taskFilePath: z.string().optional(),
  },
  async ({ title, description, priority, dependencies, taskFilePath }, context) => {
    // Send initial progress
    context.sendProgress({ status: "Creating task...", percent: 25 });
    
    try {
      // Validate inputs
      context.sendProgress({ status: "Validating inputs...", percent: 50 });
      
      // Create task
      const task = await taskFunctions.createTask(
        title,
        description,
        priority,
        dependencies,
        taskFilePath
      );
      
      context.sendProgress({ status: "Task created!", percent: 100 });
      
      return {
        content: [{ 
          type: "text", 
          text: `Task created with ID: ${task.id}` 
        }],
      };
    } catch (error) {
      return {
        content: [{ 
          type: "text", 
          text: `Error creating task: ${error.message}` 
        }],
      };
    }
  }
);
```

### Implementation Steps
1. Update the MCP Server SDK to the latest version that supports progress updates
2. Modify tools to send progress updates during long operations
3. Ensure the client-side properly handles and displays progress updates

## 8. Optimize Memory Usage

### Issue
Loading entire task file into memory for each operation and no pagination.

### Fix
```typescript
// In src/task-functions/task-manager.ts

/**
 * Get paginated tasks
 */
export async function getPaginatedTasks(
  page: number = 1,
  pageSize: number = 20,
  taskFilePath: string = DEFAULT_TASK_FILE_PATH
): Promise<{ tasks: Task[], total: number }> {
  const allTasks = await getTasksWithCache(taskFilePath);
  
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  
  return {
    tasks: allTasks.slice(start, end),
    total: allTasks.length
  };
}
```

### Implementation Steps
1. Add pagination support to task listing functions
2. Update tools to support pagination parameters
3. Consider implementing a database for larger task collections
4. Optimize string operations to reduce memory usage

## 9. Testing Recommendations

After implementing the above fixes, test the system thoroughly:

1. **Load Testing**:
   - Create a large number of tasks (100+)
   - Test concurrent operations
   - Measure response times

2. **Timeout Testing**:
   - Artificially slow down file operations
   - Verify timeout mechanisms work correctly
   - Check error responses

3. **Memory Testing**:
   - Monitor memory usage during operations
   - Identify any memory leaks
   - Test with large task descriptions

4. **User Experience**:
   - Verify progress indicators work
   - Check that error messages are informative
   - Ensure the UI remains responsive

## Conclusion

By following these steps, you should be able to resolve the timeout issues in the GitHub MCP Server. Start with the most critical fixes (server configuration and caching) and then proceed to the other optimizations.

Remember to test each change thoroughly before moving to the next one. Some fixes may introduce new challenges that need to be addressed.