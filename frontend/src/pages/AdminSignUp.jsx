import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { toast } from '../utils/react-toastify-shim';
import { signup } from './auth/stores/actions';
import { useAuthRedirect } from '../utils/useAuthRedirect';

export function AdminSignUp() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const redirectToDashboard = useAuthRedirect();

  const validateEmail = (e) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(e);
  };

  const validatePassword = (pwd) => {
    if (pwd.length < 8) return 'Password must be at least 8 characters';
    if (!/[a-z]/.test(pwd)) return 'Password must contain lowercase letters';
    if (!/[A-Z]/.test(pwd)) return 'Password must contain uppercase letters';
    if (!/[0-9]/.test(pwd)) return 'Password must contain numbers';
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) return 'Password must contain special characters (!@#$%^&*)';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !password) return toast.error('Please fill required fields');

    if (!validateEmail(email)) return toast.error('Please enter a valid email address');

    const passwordError = validatePassword(password);
    if (passwordError) return toast.error(passwordError);

    if (password !== confirm) return toast.error('Passwords do not match');

    try {
      const res = await signup({ fullName, email, password });
      toast.success('Admin account created — signing you in');
      redirectToDashboard(res?.token);
    } catch (err) {
      const msg = err && err.message ? err.message : 'Signup failed';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r r from-[#6231e9] to-[#C3A6FF]  flex items-center justify-center text-white">
      <div className="w-full max-w-[578px] bg-white/95 rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold mb-2 text-[var(--color-text)]">
          Create Account
        </h1>
        <p className="text-sm text-slate-600 mb-6">
          Set up your admin account to get started
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name *"
            placeholder="Enter your full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <Input
            label="Email Address *"
            type="email"
            placeholder="admin@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div>
            <Input
              label="Password *"
              type="password"
              showPasswordToggle
              placeholder="Create a strong password (8+ chars, mixed case, numbers, special chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={validatePassword(password)}
            />
            {password && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 bg-slate-200 h-2 rounded overflow-hidden">
                  <div
                    className={`h-full transition-all ${!validatePassword(password) ? 'bg-green-500 w-full' : 'bg-red-500 w-1/3'}`}
                  />
                </div>
                <span className={`text-xs font-medium ${!validatePassword(password) ? 'text-green-600' : 'text-red-600'}`}>
                  {!validatePassword(password) ? 'Strong' : 'Weak'}
                </span>
              </div>
            )}
          </div>
          <Input
            label="Confirm Password *"
            type="password"
            showPasswordToggle
            placeholder="Confirm your password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            error={confirm && password !== confirm ? 'Passwords do not match' : ''}
          />
          <Button type="primary" htmlType="submit" className="w-full">
            Sign Up
          </Button>
        </form>
        <p className="text-sm text-center mt-4 text-[var(--color-text)]">
          Already have an account?{" "}
          <Link to="/admin-signin" className="text-[var(--color-primary)]">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
