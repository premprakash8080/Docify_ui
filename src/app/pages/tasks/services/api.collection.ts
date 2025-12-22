import { environment } from "src/environments/environment";

export const ENDPOINTS = {
  // Task CRUD
  createTask: environment.apiUrl + '/tasks/createTask',
  getTaskById: environment.apiUrl + '/tasks/getTaskById',
  updateTask: environment.apiUrl + '/tasks/updateTask',
  toggleTaskComplete: environment.apiUrl + '/tasks/toggleTaskComplete',
  deleteTask: environment.apiUrl + '/tasks/deleteTask',
  
  // Task Ordering
  reorderTasks: environment.apiUrl + '/tasks/reorder',
  
  // Note ↔ Tasks
  getNoteTasks: environment.apiUrl + '/tasks/getNoteTasks',
  getAllTasks: environment.apiUrl + '/tasks/getAllTasks',
};
