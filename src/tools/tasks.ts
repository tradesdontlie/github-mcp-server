import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as taskFunctions from "../task-functions/index.js";

/**
 * Register task management tools with the MCP server
 */
export function registerTaskTools(server: McpServer) {
  // Tool to initialize the task management system
  server.tool(
    "initTaskMaster",
    "Initialize the task management system by creating the task directory and main markdown file",
    {
      taskFilePath: z.string().optional(),
    },
    async ({ taskFilePath }) => {
      await taskFunctions.ensureTaskInfrastructure(taskFilePath);
      return {
        content: [{ 
          type: "text", 
          text: `Task management system initialized at ${taskFilePath || taskFunctions.DEFAULT_TASK_FILE_PATH}` 
        }],
      };
    }
  );

  // Tool to create a new task
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
    async ({ title, description, priority, dependencies, taskFilePath }) => {
      const task = await taskFunctions.createTask(
        title,
        description,
        priority,
        dependencies,
        taskFilePath
      );

      return {
        content: [{ 
          type: "text", 
          text: `Task created with ID: ${task.id}` 
        }],
      };
    }
  );

  // Tool to list all tasks
  server.tool(
    "listTasks",
    "List all tasks in the task file, optionally filtered by status",
    {
      status: z.enum(["all", "completed", "pending"]).optional(),
      taskFilePath: z.string().optional(),
    },
    async ({ status = "all", taskFilePath }) => {
      await taskFunctions.ensureTaskInfrastructure(taskFilePath);
      const tasks = await taskFunctions.parseTasks(taskFilePath);
      
      let filteredTasks = tasks;
      if (status === "completed") {
        filteredTasks = tasks.filter(task => task.isCompleted);
      } else if (status === "pending") {
        filteredTasks = tasks.filter(task => !task.isCompleted);
      }

      if (filteredTasks.length === 0) {
        return {
          content: [{ type: "text", text: "No tasks found." }],
        };
      }

      const tasksFormatted = filteredTasks.map(task => {
        const status = task.isCompleted ? "✅" : "⬜";
        return `${status} **${task.title}** (ID: ${task.id})\n   Priority: ${task.priority}\n   Description: ${task.description.split('\n')[0]}...`;
      }).join("\n\n");

      return {
        content: [{ 
          type: "text", 
          text: `# Tasks (${filteredTasks.length})\n\n${tasksFormatted}` 
        }],
      };
    }
  );

  // Tool to mark a task as complete
  server.tool(
    "completeTask",
    "Mark a task as completed",
    {
      taskId: z.string(),
      taskFilePath: z.string().optional(),
    },
    async ({ taskId, taskFilePath }) => {
      const success = await taskFunctions.toggleTaskCompletion(taskId, true, taskFilePath);
      
      return {
        content: [{ 
          type: "text", 
          text: success 
            ? `Task ${taskId} marked as complete.` 
            : `Failed to complete task. Task with ID ${taskId} not found.`
        }],
      };
    }
  );

  // Tool to mark a task as pending (uncomplete it)
  server.tool(
    "uncompleteTask",
    "Mark a completed task as pending",
    {
      taskId: z.string(),
      taskFilePath: z.string().optional(),
    },
    async ({ taskId, taskFilePath }) => {
      const success = await taskFunctions.toggleTaskCompletion(taskId, false, taskFilePath);
      
      return {
        content: [{ 
          type: "text", 
          text: success 
            ? `Task ${taskId} marked as pending.` 
            : `Failed to mark task as pending. Task with ID ${taskId} not found.`
        }],
      };
    }
  );

  // Tool to get the next highest priority task
  server.tool(
    "getNextTask",
    "Get the highest priority uncompleted task with all dependencies completed",
    {
      taskFilePath: z.string().optional(),
    },
    async ({ taskFilePath }) => {
      const nextTask = await taskFunctions.getNextTask(taskFilePath);
      
      if (!nextTask) {
        return {
          content: [{ 
            type: "text", 
            text: "No tasks available to work on. Either all tasks are completed or pending tasks have unmet dependencies." 
          }],
        };
      }

      return {
        content: [{ 
          type: "text", 
          text: `# Next Task\n\n**${nextTask.title}** (ID: ${nextTask.id})\nPriority: ${nextTask.priority}\nDescription:\n${nextTask.description}`
        }],
      };
    }
  );

  // Tool to update a task
  server.tool(
    "updateTask",
    "Update a task's details",
    {
      taskId: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      priority: z.enum(["high", "medium", "low"]).optional(),
      dependencies: z.array(z.string()).optional(),
      taskFilePath: z.string().optional(),
    },
    async ({ taskId, title, description, priority, dependencies, taskFilePath }) => {
      const updates: any = {};
      if (title) updates.title = title;
      if (description) updates.description = description;
      if (priority) updates.priority = priority;
      if (dependencies) updates.dependencies = dependencies;

      const success = await taskFunctions.updateTask(taskId, updates, taskFilePath);
      
      return {
        content: [{ 
          type: "text", 
          text: success 
            ? `Task ${taskId} updated successfully.` 
            : `Failed to update task. Task with ID ${taskId} not found.`
        }],
      };
    }
  );
} 