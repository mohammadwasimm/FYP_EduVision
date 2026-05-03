/**
 * Wrapper/shim for react-toastify to provide a consistent toast notification API
 */
import { toast as toastify, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

/**
 * Standardized toast notification object
 * Provides success, error, info, warning methods
 */
const toast = {
  success: (message, options = {}) => {
    return toastify.success(message, {
      position: 'top-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options,
    });
  },

  error: (message, options = {}) => {
    return toastify.error(message, {
      position: 'top-right',
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options,
    });
  },

  info: (message, options = {}) => {
    return toastify.info(message, {
      position: 'top-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options,
    });
  },

  warning: (message, options = {}) => {
    return toastify.warning(message, {
      position: 'top-right',
      autoClose: 3500,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options,
    });
  },

  loading: (message, options = {}) => {
    return toastify.loading(message, {
      position: 'top-right',
      autoClose: false,
      hideProgressBar: false,
      closeOnClick: false,
      pauseOnHover: true,
      draggable: false,
      ...options,
    });
  },

  dismiss: (toastId) => {
    if (toastId !== undefined) {
      toastify.dismiss(toastId);
    } else {
      toastify.dismiss();
    }
  },

  update: (toastId, options) => {
    return toastify.update(toastId, options);
  },

  duration: 3000, // Default duration in ms
};

export { toast, ToastContainer };
