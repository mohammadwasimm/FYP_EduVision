import { dispatch } from '../../../store/store';
import { changePasswordApi, type ChangePasswordPayload } from './apis';
import {
  CHANGE_PASSWORD_REQUEST,
  CHANGE_PASSWORD_SUCCESS,
  CHANGE_PASSWORD_FAILURE,
} from './actionTypes';

export const changePassword = async (payload: ChangePasswordPayload) => {
  try {
    dispatch({ type: CHANGE_PASSWORD_REQUEST });
    const response = await changePasswordApi(payload);
    dispatch({ type: CHANGE_PASSWORD_SUCCESS, payload: response });
    return response;
  } catch (error: any) {
    dispatch({ type: CHANGE_PASSWORD_FAILURE, payload: error?.message || 'Failed to change password' });
    throw error;
  }
};
