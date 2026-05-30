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
  UPDATE_USER_PROFILE,
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

export const updateUserProfile = (updates: any) => {
  // Get current user from localStorage as fallback
  let currentUser = null;
  try {
    const stored = localStorage.getItem('edu:admin');
    currentUser = stored ? JSON.parse(stored) : null;
  } catch (_) {}

  if (!currentUser) {
    // If no stored user, just dispatch without persisting
    dispatch({ type: UPDATE_USER_PROFILE, payload: updates });
    return;
  }

  const updatedUser = { ...currentUser, ...updates };
  persistAdmin(updatedUser);
  dispatch({ type: UPDATE_USER_PROFILE, payload: updatedUser });
};

export const signout = () => {
  clearAdmin();
  dispatch({ type: SIGNOUT });
};
