import { environment } from "src/environments/environment";

export const ENDPOINTS = {
    // Auth endpoints
    login: `${environment.apiUrl}/users/login`,
    register: `${environment.apiUrl}/users/register`,
    logout: `${environment.apiUrl}/users/logout`,
    refreshToken: `${environment.apiUrl}/users/refresh-token`,
    
    // Password recovery
    forgotPassword: `${environment.apiUrl}/users/forgot-password`,
    resetPassword: `${environment.apiUrl}/users/reset-password`,
    
    // Profile
    getProfile: `${environment.apiUrl}/users/me`,
    updateProfile: `${environment.apiUrl}/users/me`,
    
    // Security
    changePassword: `${environment.apiUrl}/users/change-password`,
    
    // User Settings
    getUserSettings: `${environment.apiUrl}/users/settings`,
    updateUserSettings: `${environment.apiUrl}/users/settings`,
    
    // Account
    deleteAccount: `${environment.apiUrl}/users/delete-account`,
}