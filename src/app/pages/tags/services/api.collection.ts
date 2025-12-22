import { environment } from "src/environments/environment";


export const ENDPOINTS = {
    // Tags CRUD
    getAllTags: environment.apiUrl + '/tags',
    getTagById: environment.apiUrl + '/tags/getTagById',
    createTag: environment.apiUrl + '/tags',
    updateTag: environment.apiUrl + '/tags',
    deleteTag: environment.apiUrl + '/tags',
    
    // Tag ↔ Note Relations
    attachTagToNote: environment.apiUrl + '/tags',
    detachTagFromNote: environment.apiUrl + '/tags',
    getColors: environment.apiUrl + '/tags/colors',
}