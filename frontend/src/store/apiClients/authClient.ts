import { createBaseClient } from './baseClient';
import { ENV_CONFIG } from '../../config/env';

const authClient = createBaseClient(ENV_CONFIG.API_BASE_URL);

export interface SignupRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface SigninRequest {
  email: string;
  password: string;
}

export const authApi = {
  signup: (data: SignupRequest) => authClient.post('/api/auth/signup', data),
  signin: (data: SigninRequest) => authClient.post('/api/auth/signin', data),
  getProfile: () => authClient.get('/api/auth/me'),
};

export default authClient;
