import React, { useState } from 'react';
import { Lock, CheckCircle } from 'lucide-react';
import Input from './Input';
import PasswordStrength from './PasswordStrength';
import { ResetPasswordData } from '../../types/auth';

interface ResetPasswordFormProps {
  email: string;
  resetToken: string;
  onSwitchMode: (mode: 'login') => void;
}

const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ email, resetToken, onSwitchMode }) => {
  const [formData, setFormData] = useState<ResetPasswordData>({
    newPassword: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          resetToken,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to reset password');
      }

      setSuccess(true);
      setTimeout(() => {
        onSwitchMode('login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-xl shadow-green-500/30">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-black text-[#001533]">Password Reset!</h2>
        <p className="text-sm text-slate-500 text-center">
          Your password has been successfully updated.<br />
          Redirecting to login...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full animate-in fade-in duration-500">
      <div className="flex flex-col items-center mb-3">
        <div className="w-14 h-14 bg-[#ff7a00] rounded-[18px] flex items-center justify-center shadow-xl shadow-[#ff7a00]/30 mb-3">
           <Lock className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-2xl font-black text-[#001533]">Reset Password</h2>
        <p className="text-xs text-slate-500 mt-1 text-center">Enter your new password</p>
      </div>

      <div className="flex flex-col">
        <Input
          label="New Password"
          name="newPassword"
          type="password"
          placeholder="••••••••"
          required
          icon={<Lock size={18} />}
          value={formData.newPassword}
          onChange={handleChange}
        />
        <PasswordStrength password={formData.newPassword} />
      </div>

      <Input
        label="Confirm Password"
        name="confirmPassword"
        type="password"
        placeholder="••••••••"
        required
        icon={<Lock size={18} />}
        value={formData.confirmPassword}
        onChange={handleChange}
      />

      {error && (
        <div className="text-xs text-red-500 font-medium bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 w-full py-3.5 px-6 rounded-xl bg-[#ff7a00] text-white font-black text-sm tracking-widest shadow-lg shadow-[#ff7a00]/30 hover:bg-[#e66e00] hover:shadow-[#ff7a00]/40 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : 'RESET PASSWORD'}
      </button>
    </form>
  );
};

export default ResetPasswordForm;
