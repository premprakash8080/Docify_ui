import { environment } from "src/environments/environment";


export const ENDPOINTS = {
    // Tags CRUD

    createTemplate: environment.apiUrl + '/templates/createTemplate',
    getAllTemplates: environment.apiUrl + '/templates/getAllTemplates',
    getTemplateById: environment.apiUrl + '/templates/getTemplateById',
    updateTemplate: environment.apiUrl + '/templates/updateTemplate',
    deleteTemplate: environment.apiUrl + '/templates/deleteTemplate',
    cloneTemplate: environment.apiUrl + '/templates/cloneTemplate',
    getSystemTemplates: environment.apiUrl + '/templates/getSystemTemplates',
    getUserTemplates: environment.apiUrl + '/templates/getMyTemplates',
   
}