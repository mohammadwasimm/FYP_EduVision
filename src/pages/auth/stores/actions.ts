import { dispatch } from '../../../store/store';
import { signupApi, signinApi } from './apis';
import { tokenCookieUtils } from '../../../utils/cookies';
import {
  SIGNUP_REQUEST,
  SIGNUP_SUCCESS,
  SIGNUP_FAILURE,
  SIGNIN_REQUEST,
  SIGNIN_SUCCESS,
  SIGNIN_FAILURE,
  SIGNOUT,
} from './actionTypes';

function persistAdmin(admin: any) {
  try { localStorage.setItem('edu:admin', JSON.stringify(admin)); } catch (_) {}
}

function clearAdmin() {
  try { localStorage.removeItem('edu:admin'); } catch (_) {}
}

export const signup = async (payload: { fullName: string; email: string; password: string }) => {
  try {
    dispatch({ type: SIGNUP_REQUEST });
    const response = await signupApi(payload);
    if (response?.token) tokenCookieUtils.setAccessToken(response.token);
    if (response?.admin) persistAdmin(response.admin);
    dispatch({ type: SIGNUP_SUCCESS, payload: response });
    return response;
  } catch (err: any) {
    dispatch({ type: SIGNUP_FAILURE, payload: err?.message || 'Signup failed' });
    throw err;
  }
};

export const signin = async (payload: { email: string; password: string }) => {
  try {
    dispatch({ type: SIGNIN_REQUEST });
    const response = await signinApi(payload);
    if (response?.token) tokenCookieUtils.setAccessToken(response.token);
    if (response?.admin) persistAdmin(response.admin);
    dispatch({ type: SIGNIN_SUCCESS, payload: response });
    return response;
  } catch (err: any) {
    dispatch({ type: SIGNIN_FAILURE, payload: err?.message || 'Signin failed' });
    throw err;
  }
};

export const signout = () => {
  clearAdmin();
  dispatch({ type: SIGNOUT });
};
