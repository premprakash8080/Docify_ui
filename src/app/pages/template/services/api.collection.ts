import { environment } from "src/environments/environment";


export const ENDPOINTS = {
    // Tags CRUD

    createTemplate: environment.apiUrl + '/tasks/createTask',
    getAllTemplates: environment.apiUrl + '/tasks/getAllTasks',
    getTemplateById: environment.apiUrl + '/tasks/getTaskById',
    updateTemplate: environment.apiUrl + '/tasks/updateTask',
    deleteTemplate: environment.apiUrl + '/tasks/deleteTask',
    cloneTemplate: environment.apiUrl + '/tasks/cloneTask',
    getSystemTemplates: environment.apiUrl + '/tasks/getSystemTasks',
    getUserTemplates: environment.apiUrl + '/tasks/getMyTasks',
   
}