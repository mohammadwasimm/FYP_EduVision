import { authApi } from '../../../store/apiClients/authClient';

export const signupApi = (data: any) => authApi.signup(data).then(res => res.data);
export const signinApi = (data: any) => authApi.signin(data).then(res => res.data);
