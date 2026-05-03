import React, { useState } from 'react';
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

  const handleSubmit = (e) => {
    e.preventDefault();
  if (!fullName || !email || !password) return toast.error('Please fill required fields');
  if (password !== confirm) return toast.error('Passwords do not match');
  // TODO: call backend to create student account
  toast.success('Student account created');
    nav('/student-enroll');
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold mb-2">Create Account</h1>
        <p className="text-sm text-slate-600 mb-6">Set up your student account to get started</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Full Name</label>
            <Input placeholder="Enter your full name" value={fullName} onChange={(e)=>setFullName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">Email Address</label>
            <Input placeholder="you@example.com" value={email} onChange={(e)=>setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <Input type="password" placeholder="Create a strong password" value={password} onChange={(e)=>setPassword(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">Confirm Password</label>
            <Input type="password" placeholder="Confirm your password" value={confirm} onChange={(e)=>setConfirm(e.target.value)} />
          </div>
          <Button type="primary" htmlType="submit" className="w-full">Sign Up</Button>
        </form>
        <p className="text-sm text-center mt-4">Already have an account? <a href="/">Sign in</a></p>
      </div>
    </div>
  );
}
