import React, { useEffect, useState } from 'react';

let _showToast = null;

export function showToast(text, opts = {}) {
  if (_showToast) _showToast(text, opts);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    _showToast = (text, opts = {}) => {
      const id = Date.now() + Math.random();
      const toast = { id, text, type: opts.type || 'success', duration: opts.duration || 3000 };
      setToasts((t) => [...t, toast]);
      setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id));
      }, toast.duration);
    };
    return () => { _showToast = null; };
  }, []);

  return (
    <>
      {children}
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999 }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              marginBottom: 8,
              background: t.type === 'error' ? '#FECDD3' : '#D1FAE5',
              color: t.type === 'error' ? '#9B1C1C' : '#065F46',
              padding: '10px 14px',
              borderRadius: 8,
              boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
              minWidth: 200,
            }}
          >
            {t.text}
          </div>
        ))}
      </div>
    </>
  );
}

export default ToastProvider;
