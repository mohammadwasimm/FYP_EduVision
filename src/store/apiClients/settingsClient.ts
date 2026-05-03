import { createBaseClient } from './baseClient';
import { ENV_CONFIG } from '../../config/env';

const settingsClient = createBaseClient(ENV_CONFIG.API_BASE_URL);

export interface SettingsPayload {
  notifications?: {
    emailAlerts?: boolean;
    criticalOnly?: boolean;
    dailyDigest?: boolean;
    soundAlerts?: boolean;
    browserNotifications?: boolean;
  };
  security?: {
    passwordStrength?: string;
  };
  reports?: {
    autoClearDays?: number;
    exportFormat?: 'csv' | 'pdf';
  };
}

export interface ChangePasswordPayload {
  email: string;
  currentPassword: string;
  newPassword: string;
}

export const settingsApi = {
  get: () => settingsClient.get('/api/settings'),
  update: (data: SettingsPayload) => settingsClient.put('/api/settings', data),
  changePassword: (data: ChangePasswordPayload) => settingsClient.put('/api/settings/password', data),
  clearIncidents: (days: number) => settingsClient.post('/api/settings/clear-incidents', { days }),
};

export default settingsClient;
