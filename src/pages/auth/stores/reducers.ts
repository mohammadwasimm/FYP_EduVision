import {
  SIGNUP_REQUEST,
  SIGNUP_SUCCESS,
  SIGNUP_FAILURE,
  SIGNIN_REQUEST,
  SIGNIN_SUCCESS,
  SIGNIN_FAILURE,
  SIGNOUT,
} from './actionTypes';

// Restore admin profile across page refreshes
const storedAdmin = (() => {
  try { return JSON.parse(localStorage.getItem('edu:admin') || 'null'); } catch { return null; }
})();

const initialState = {
  user: storedAdmin,
  token: null,
  loading: false,
  error: null,
};

export default function authReducer(state = initialState, action: any) {
  switch (action.type) {
    case SIGNUP_REQUEST:
    case SIGNIN_REQUEST:
      return { ...state, loading: true, error: null };
    case SIGNUP_SUCCESS:
      return { ...state, loading: false, user: action.payload.admin };
    case SIGNIN_SUCCESS:
      return { ...state, loading: false, user: action.payload.admin, token: action.payload.token };
    case SIGNUP_FAILURE:
    case SIGNIN_FAILURE:
      return { ...state, loading: false, error: action.payload };
    case SIGNOUT:
      return { ...state, user: null, token: null };
    default:
      return state;
  }
}
