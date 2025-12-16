import { environment } from 'src/environments/environment';

export const ENDPOINTS = {
  getUserSettings: `${environment.apiUrl}/users/settings`,
  updateUserSettings: `${environment.apiUrl}/users/settings`,
};
