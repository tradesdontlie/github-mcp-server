import fs from 'fs-extra';
import type { Task, TaskPriority } from './core.js';
import { 
  DEFAULT_TASK_FILE_PATH,
  DEFAULT_PRIORITY,
  isValidPriority,
  generateTaskId,
  getCurrentTimestamp
} from './core.js';

/**
 * Parse the Markdown file and extract all tasks
 */
export async function parseTasks(taskFilePath: string = DEFAULT_TASK_FILE_PATH): Promise<Task[]> {
  if (!(await fs.pathExists(taskFilePath))) {
    return [];
  }

  const content = await fs.readFile(taskFilePath, 'utf-8');
  const tasks: Task[] = [];
  
  // Regular expression to match task entries
  // This regex captures all the components of a task in our markdown format
  const taskRegex = /- \[([ x])\] \*\*(.*?)\*\* `\(ID: ([\w-_]+)\)`\s+- \*\*Priority:\*\* `(high|medium|low)`\s+- \*\*Dependencies:\*\* `(.*?)`\s+- \*\*Created:\*\* `(.*?)`\s+- \*\*Description:\*\*\s+```\s+([\s\S]*?)```/g;
  
  let match;
  while ((match = taskRegex.exec(content)) !== null) {
    const [, status, title, id, priority, dependencies, created, description] = match;
    
    if (title && id && priority && dependencies && created && description) {
      // Clean up dependency IDs by splitting and trimming each one
      const dependencyArray = dependencies === 'None' 
        ? [] 
        : dependencies.split(',').map(dep => dep.trim()).filter(dep => dep !== '');
      
      tasks.push({
        id,
        title,
        isCompleted: status === 'x',
        priority: priority as TaskPriority,
        dependencies: dependencyArray,
        created,
        description: description.trim()
      });
    }
  }
  
  return tasks;
}

/**
 * Format a single task as Markdown
 */
export function formatTaskAsMarkdown(task: Task): string {
  const checkbox = task.isCompleted ? '[x]' : '[ ]';
  const dependenciesStr = task.dependencies.length > 0 
    ? task.dependencies.join(', ') 
    : 'None';
  
  return [
    `- ${checkbox} **${task.title}** \`(ID: ${task.id})\``,
    `    - **Priority:** \`${task.priority}\``,
    `    - **Dependencies:** \`${dependenciesStr}\``,
    `    - **Created:** \`${task.created}\``,
    `    - **Description:** `,
    `      \`\`\``,
    `      ${task.description}`,
    `      \`\`\``
  ].join('\n');
}

/**
 * Create a new task and add it to the markdown file
 */
export async function createTask(
  title: string,
  description: string,
  priority: string = DEFAULT_PRIORITY,
  dependencies: string[] = [],
  taskFilePath: string = DEFAULT_TASK_FILE_PATH
): Promise<Task> {
  // Validate priority
  const validPriority = isValidPriority(priority) ? priority : DEFAULT_PRIORITY;
  
  // Create new task object
  const task: Task = {
    id: generateTaskId(title),
    title,
    description,
    priority: validPriority as TaskPriority,
    dependencies,
    isCompleted: false,
    created: getCurrentTimestamp()
  };
  
  // Read existing file
  let content = await fs.readFile(taskFilePath, 'utf-8');
  
  // Find position to insert (before the footer)
  const footerPosition = content.indexOf('---\n*Managed by Task Master MCP*');
  if (footerPosition === -1) {
    // If no footer, add to the end
    content += '\n\n' + formatTaskAsMarkdown(task);
  } else {
    // Insert before the footer
    content = 
      content.slice(0, footerPosition) + 
      '\n' + formatTaskAsMarkdown(task) + '\n\n' + 
      content.slice(footerPosition);
  }
  
  // Write file back
  await fs.writeFile(taskFilePath, content, 'utf-8');
  
  return task;
}

/**
 * Update the completion status of a task
 */
export async function toggleTaskCompletion(
  taskId: string, 
  isCompleted: boolean,
  taskFilePath: string = DEFAULT_TASK_FILE_PATH
): Promise<boolean> {
  const content = await fs.readFile(taskFilePath, 'utf-8');
  
  // Find the task by ID and update its checkbox
  const idPattern = new RegExp(`- \\[([ x])\\] \\*\\*.*?\\*\\* \`\\(ID: ${taskId}\\)\``, 'g');
  const newStatus = isCompleted ? 'x' : ' ';
  
  const newContent = content.replace(idPattern, (match) => {
    return match.replace(/\[([ x])\]/, `[${newStatus}]`);
  });
  
  // If content didn't change, the task wasn't found
  if (newContent === content) {
    return false;
  }
  
  await fs.writeFile(taskFilePath, newContent, 'utf-8');
  return true;
}

/**
 * Get the highest priority uncompleted task with all dependencies completed
 */
export async function getNextTask(taskFilePath: string = DEFAULT_TASK_FILE_PATH): Promise<Task | null> {
  const tasks = await parseTasks(taskFilePath);
  
  // If no tasks exist yet, return null
  if (tasks.length === 0) {
    return null;
  }
  
  // Filter to uncompleted tasks
  const uncompletedTasks = tasks.filter(task => !task.isCompleted);
  
  if (uncompletedTasks.length === 0) {
    return null;
  }
  
  // Find tasks with all dependencies completed
  const completedTasks = tasks.filter(t => t.isCompleted);
  const completedTaskIds = completedTasks.map(t => t.id);
  
  const tasksWithCompletedDeps = uncompletedTasks.filter(task => {
    // If no dependencies, it's ready
    if (!task.dependencies || task.dependencies.length === 0) {
      return true;
    }
    
    // Check if all dependencies are in the completed tasks list
    // This improved version ensures we're comparing trimmed IDs
    return task.dependencies.every(depId => {
      // Skip empty dependencies
      if (!depId || depId.trim() === '') {
        return true;
      }
      
      // Check if the dependency ID is in the list of completed task IDs
      return completedTaskIds.includes(depId.trim());
    });
  });
  
  if (tasksWithCompletedDeps.length === 0) {
    return null;
  }
  
  // Sort by priority (high > medium > low)
  const priorityOrder: Record<TaskPriority, number> = {
    high: 3,
    medium: 2,
    low: 1
  };
  
  // Sort by priority and return the highest priority task
  const sortedTasks = tasksWithCompletedDeps.sort((a, b) => {
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
  
  return sortedTasks[0] || null;
}

/**
 * Update a task's details
 */
export async function updateTask(
  taskId: string,
  updates: Partial<Omit<Task, 'id' | 'created'>>,
  taskFilePath: string = DEFAULT_TASK_FILE_PATH
): Promise<boolean> {
  const tasks = await parseTasks(taskFilePath);
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  
  if (taskIndex === -1) {
    return false;
  }
  
  const task = tasks[taskIndex];
  
  // Make sure task exists (this should never happen due to the check above)
  if (!task) {
    return false;
  }
  
  // Update the task with type safety
  const updatedTask: Task = {
    // Start with the existing task properties
    ...task,
    // Apply updates
    ...updates,
    // Ensure these fields are not overwritten
    id: task.id,
    created: task.created
  };
  
  // Rebuild the markdown file
  const updatedTasks = [
    ...tasks.slice(0, taskIndex),
    updatedTask,
    ...tasks.slice(taskIndex + 1)
  ];
  
  // Generate markdown content
  let newContent = '# Project Tasks\n\n';
  newContent += updatedTasks.map(t => formatTaskAsMarkdown(t)).join('\n\n');
  newContent += '\n\n---\n*Managed by Task Master MCP*\n';
  
  await fs.writeFile(taskFilePath, newContent, 'utf-8');
  return true;
} 