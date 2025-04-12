import fs from 'fs-extra';
import path from 'path';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Constants
export const DEFAULT_TASK_FILE_PATH = process.env.TASK_FILE_PATH || 'tasks/main.md';
export const MAX_SUBTASKS = parseInt(process.env.MAX_SUBTASKS || '5', 10);
export const DEFAULT_PRIORITY = process.env.DEFAULT_PRIORITY || 'medium';

// Types
export type TaskPriority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  isCompleted: boolean;
  priority: TaskPriority;
  dependencies: string[];
  created: string;
  description: string;
}

/**
 * Ensures the tasks directory and main markdown file exist
 */
export async function ensureTaskInfrastructure(taskFilePath: string = DEFAULT_TASK_FILE_PATH): Promise<void> {
  const dir = path.dirname(taskFilePath);
  await fs.ensureDir(dir);
  
  if (!(await fs.pathExists(taskFilePath))) {
    await fs.writeFile(
      taskFilePath,
      '# Project Tasks\n\n' +
      '---\n*Managed by Task Master MCP*\n',
      'utf-8'
    );
  }
}

/**
 * Generates a unique ID for a new task
 */
export function generateTaskId(title: string): string {
  // Create a slug from the title (lowercase, replace spaces with underscores, remove special chars)
  const slug = title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 15);  // Keep it reasonable length
  
  // Add a short UUID segment for uniqueness
  const uniqueId = randomUUID().slice(0, 8);
  
  return `${slug}_${uniqueId}`;
}

/**
 * Get current ISO timestamp
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Validate a task priority
 */
export function isValidPriority(priority: string): priority is TaskPriority {
  return ['high', 'medium', 'low'].includes(priority);
} 