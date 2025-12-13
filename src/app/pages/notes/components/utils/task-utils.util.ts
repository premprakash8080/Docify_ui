/**
 * Task utility functions for notes components
 * Centralized task-related logic to avoid duplication
 */

import { Task } from '../../../../core/models';

/**
 * Gets the count of completed tasks
 * @param tasks - Array of tasks or undefined
 * @returns Number of completed tasks
 */
export function getCompletedTasksCount(tasks: Task[] | undefined): number {
  if (!tasks || !Array.isArray(tasks)) return 0;
  return tasks.filter(t => t.completed).length;
}

/**
 * Checks if a task's due date is overdue
 * @param dueDate - ISO date string
 * @returns True if the due date is in the past
 */
export function isTaskOverdue(dueDate: string): boolean {
  return new Date(dueDate) < new Date();
}

/**
 * Track function for tasks in *ngFor loops
 * @param index - Array index
 * @param task - Task object
 * @returns Task ID for tracking
 */
export function trackByTaskId(index: number, task: Task): string {
  return task.id;
}
