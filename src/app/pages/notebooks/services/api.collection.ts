import { environment } from "src/environments/environment";

export const ENDPOINTS = {
    // Stacks CRUD
    getAllStacks: `${environment.apiUrl}/stacks`,
    getStackById: (id: string) => `${environment.apiUrl}/stacks/${id}`,
    createStack: `${environment.apiUrl}/stacks`,
    updateStack: (id: string) => `${environment.apiUrl}/stacks/${id}`,
    deleteStack: (id: string) => `${environment.apiUrl}/stacks/${id}`,
    reorderStacks: `${environment.apiUrl}/stacks/reorder`,
    getStackNotebooks: (id: string) => `${environment.apiUrl}/stacks/${id}/notebooks`,
    
    // Notebooks CRUD
    getAllNotebooks: `${environment.apiUrl}/notebooks/list`,
    getNotebookById: (id: string) => `${environment.apiUrl}/notebooks/${id}`,
    createNotebook: `${environment.apiUrl}/notebooks/createNotebook`,
    updateNotebook: (id: string) => `${environment.apiUrl}/notebooks/${id}`,
    deleteNotebook: (id: string) => `${environment.apiUrl}/notebooks/${id}`,
    reorderNotebooks: `${environment.apiUrl}/notebooks/reorder`,
    
    // Notebook ↔ Stack
    moveNotebookToStack: environment.apiUrl + '/notebooks/stack/updateNotebookStack',
    removeNotebookFromStack: environment.apiUrl+ '/notebooks/stack/removeNotebookFromStack',
    
    // Notebook ↔ Notes
    getNotebookNotes: (id: string) => `${environment.apiUrl}/notebooks/${id}/notes`,

    // Get notebook notes by ID (query param: ?id=...)
    getNotebookNotesById: environment.apiUrl + '/notebooks/getNotebookNotesById',
    
}