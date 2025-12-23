import { environment } from "src/environments/environment";

export const ENDPOINTS = {
       // Profile
       getProfile: `${environment.apiUrl}/users/profile`,
       updateProfile: `${environment.apiUrl}/users/profile`,
}