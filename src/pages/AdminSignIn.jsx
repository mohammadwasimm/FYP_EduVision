import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { toast } from '../utils/react-toastify-shim';
import { signin } from './auth/stores/actions';
import { useAuthRedirect } from '../utils/useAuthRedirect';
import { tokenCookieUtils } from '../utils/cookies';

export function AdminSignIn() {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('');
  const redirectToDashboard = useAuthRedirect();

  // Skip sign-in if admin already has a valid token
  useEffect(() => {
    if (tokenCookieUtils.isTokenValid()) {
      redirectToDashboard();
    }
  }, [redirectToDashboard]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please enter credentials');
    try {
      const res = await signin({ email, password });
      toast.success('Signed in');
      redirectToDashboard(res?.token);
    } catch (err) {
      const msg = err && err.message ? err.message : 'Signin failed';
      toast.error(msg);
    }
  };
  return (
<div className="min-h-screen bg-gradient-to-r from-[#6231e9] to-[#C3A6FF] flex items-center justify-center text-white">      <div className="w-full max-w-[578px] bg-white/95 dark:bg-white/95 rounded-2xl shadow p-8">
  <h1 className="text-2xl font-bold mb-2 text-[var(--color-text)]">Sign In</h1>
  <p className="text-sm text-slate-600 mb-6">Enter your credentials to access the admin panel</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input label="Email / Username" placeholder="admin@example.com" value={email} onChange={(e)=>setEmail(e.target.value)} />
          </div>
          <div>
            <Input label="Password" type="password" placeholder="Enter your password" value={password} onChange={(e)=>setPassword(e.target.value)} />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-[var(--color-text)]"><input type="checkbox"/> Remember me</label>
            <a className="text-sm text-[var(--color-primary)]" href="#">Forgot password?</a>
          </div>
          <Button type="primary" htmlType="submit" className="w-full">Sign In</Button>
        </form>
  <p className="text-sm text-center mt-4 text-[var(--color-text)]">Don't have an account? <Link to="/admin-signup" className="text-[var(--color-primary)]">Sign up</Link></p>
      </div>
    </div>
  );
}
