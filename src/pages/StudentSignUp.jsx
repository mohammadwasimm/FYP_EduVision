import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { toast } from '../utils/react-toastify-shim';

export function StudentSignUp() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const nav = useNavigate();

  const validatePassword = (pwd) => {
    if (pwd.length < 8) return 'Password must be at least 8 characters';
    if (!/[a-z]/.test(pwd)) return 'Password must contain lowercase letters';
    if (!/[A-Z]/.test(pwd)) return 'Password must contain uppercase letters';
    if (!/[0-9]/.test(pwd)) return 'Password must contain numbers';
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) return 'Password must contain special characters (!@#$%^&*)';
    return '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!fullName || !email || !password) return toast.error('Please fill required fields');

    if (!email.includes('@')) return toast.error('Please enter a valid email address');

    const passwordError = validatePassword(password);
    if (passwordError) return toast.error(passwordError);

    if (password !== confirm) return toast.error('Passwords do not match');

    // TODO: call backend to create student account
    toast.success('Student account created');
    nav('/student-enroll');
  };

  const passwordError = validatePassword(password);
  const passwordStrength = password && !passwordError ? 'strong' : password ? 'weak' : '';

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold mb-2">Create Account</h1>
        <p className="text-sm text-slate-600 mb-6">Set up your student account to get started</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name *"
            placeholder="Enter your full name"
            value={fullName}
            onChange={(e)=>setFullName(e.target.value)}
          />
          <Input
            label="Email Address *"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
          />
          <div>
            <Input
              label="Password *"
              type="password"
              showPasswordToggle
              placeholder="Create a strong password (8+ chars, mixed case, numbers, special chars)"
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              error={passwordError}
            />
            {password && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 bg-slate-200 h-2 rounded overflow-hidden">
                  <div
                    className={`h-full transition-all ${passwordStrength === 'strong' ? 'bg-green-500 w-full' : 'bg-red-500 w-1/3'}`}
                  />
                </div>
                <span className={`text-xs font-medium ${passwordStrength === 'strong' ? 'text-green-600' : 'text-red-600'}`}>
                  {passwordStrength === 'strong' ? 'Strong' : 'Weak'}
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
            onChange={(e)=>setConfirm(e.target.value)}
            error={confirm && password !== confirm ? 'Passwords do not match' : ''}
          />
          <Button type="primary" htmlType="submit" className="w-full">Sign Up</Button>
        </form>
        <p className="text-sm text-center mt-4">Already have an account? <a href="/">Sign in</a></p>
      </div>
    </div>
  );
}
