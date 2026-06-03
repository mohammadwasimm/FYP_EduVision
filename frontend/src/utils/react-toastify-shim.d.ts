import type { ComponentType } from 'react';

type ToastOptions = Record<string, any>;

declare const toast: {
  success: (message: string, options?: ToastOptions) => any;
  error: (message: string, options?: ToastOptions) => any;
  info: (message: string, options?: ToastOptions) => any;
  warning: (message: string, options?: ToastOptions) => any;
  loading: (message: string, options?: ToastOptions) => any;
  dismiss: (toastId?: any) => void;
  update: (toastId: any, options: ToastOptions) => any;
  duration: number;
};

declare const ToastContainer: ComponentType<any>;

export { toast, ToastContainer };
