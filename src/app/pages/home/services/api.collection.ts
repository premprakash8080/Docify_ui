import { environment } from "src/environments/environment";


export const ENDPOINTS = {
    // Tags CRUD
    getAllTags: environment.apiUrl + '/tags',
    getTagById: environment.apiUrl + '/tags',

    // Scratch pad
    getScratchpad: environment.apiUrl + '/scratch-pad',
    updateScratchpad: environment.apiUrl + '/scratch-pad',
    clearScratchpad: environment.apiUrl + '/scratch-pad',

}