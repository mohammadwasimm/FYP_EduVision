import { settingsApi } from '../../../store/apiClients/settingsClient';

export interface ChangePasswordPayload {
  email: string;
  currentPassword: string;
  newPassword: string;
}

export const changePasswordApi = async (payload: ChangePasswordPayload) => {
  const response = await settingsApi.changePassword(payload);
  const body = (response as any).data;
  return body && body.data ? body.data : body;
};
