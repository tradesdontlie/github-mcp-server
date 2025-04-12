# Task Master Documentation

Task Master is a markdown-based task management system integrated into the MCP server. It allows AI assistants to manage and track tasks in a structured format.

## Features

- Create, update, and complete tasks
- List tasks with filtering by status
- Get the next highest priority task to work on
- Track task dependencies
- Set task priorities
- Store tasks in human-readable and machine-parsable markdown

## Task File Format

Tasks are stored in a markdown file with the following structure:

```markdown
# Project Tasks

- [ ] **Task Title** `(ID: unique_task_id)`
    - **Priority:** `high`
    - **Dependencies:** `ID1, ID2`
    - **Created:** `2023-08-01T12:00:00Z`
    - **Description:** 
      ```
      Multi-line description 
      can go here.
      ```
- [x] **Completed Task Title** `(ID: another_id)`
    - **Priority:** `medium`
    - **Dependencies:** `None`
    - **Created:** `2023-08-01T12:00:00Z`
    - **Description:**
      ```
      This task is finished.
      ```

---
*Managed by Task Master MCP*
```

The checkbox `[ ]` indicates a pending task, and `[x]` indicates a completed task.

## Environment Variables

The Task Master uses the following environment variables:

- `MAX_SUBTASKS`: Maximum number of subtasks to generate (default: 5)
- `DEFAULT_PRIORITY`: Default priority for new tasks (default: medium)
- `TASK_FILE_PATH`: Custom path for the task file (default: tasks/main.md)

## Available Tools

### initTaskMaster

Initialize the task management system by creating the necessary directory and markdown file.

Parameters:
- `taskFilePath` (optional): Custom path for the task file

### createTask

Create a new task and add it to the task file.

Parameters:
- `title`: The task title
- `description`: Detailed description of the task
- `priority` (optional): Task priority (high, medium, low)
- `dependencies` (optional): Array of task IDs this task depends on
- `taskFilePath` (optional): Custom path for the task file

### listTasks

List all tasks in the file, optionally filtered by status.

Parameters:
- `status` (optional): Filter tasks by status (all, completed, pending)
- `taskFilePath` (optional): Custom path for the task file

### completeTask

Mark a task as completed.

Parameters:
- `taskId`: ID of the task to complete
- `taskFilePath` (optional): Custom path for the task file

### uncompleteTask

Mark a completed task as pending.

Parameters:
- `taskId`: ID of the task to mark as pending
- `taskFilePath` (optional): Custom path for the task file

### getNextTask

Get the highest priority uncompleted task that has all dependencies met.

Parameters:
- `taskFilePath` (optional): Custom path for the task file

### updateTask

Update a task's details.

Parameters:
- `taskId`: ID of the task to update
- `title` (optional): New task title
- `description` (optional): New task description
- `priority` (optional): New task priority
- `dependencies` (optional): New dependencies array
- `taskFilePath` (optional): Custom path for the task file

## Example Usage

```typescript
// Initialize the task system
await initTaskMaster();

// Create a new task
await createTask({
  title: "Implement authentication",
  description: "Add user authentication using JWT tokens",
  priority: "high"
});

// List all pending tasks
await listTasks({ status: "pending" });

// Get the next task to work on
const nextTask = await getNextTask();

// Mark a task as complete
await completeTask({ taskId: "implement_auth_12345678" });

// Update a task
await updateTask({
  taskId: "create_api_87654321",
  priority: "high",
  description: "Create RESTful API endpoints for user management"
});
```

## Integration with AI Assistants

Task Master is designed to work seamlessly with AI assistants like Claude in Cursor. AI assistants can:

1. Parse specification documents to generate tasks
2. Track project progress through task completion status
3. Break down complex tasks into smaller subtasks
4. Prioritize work based on task dependencies and priorities
5. Implement features based on task descriptions

The structured markdown format provides both human readability and machine parseability, making it ideal for human-AI collaboration. 