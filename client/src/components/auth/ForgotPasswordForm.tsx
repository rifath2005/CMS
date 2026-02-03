import React, { useState } from 'react';
import { Mail, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import Input from './Input';
import { ForgotPasswordData } from '../../types/auth';

interface ForgotPasswordFormProps {
  onSwitchMode: (mode: 'login' | 'verify-otp') => void;
  onEmailSubmit: (email: string) => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onSwitchMode, onEmailSubmit }) => {
  const [formData, setFormData] = useState<ForgotPasswordData>({
    email: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      const response = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to send OTP');
      }

      setSuccess(true);
      onEmailSubmit(formData.email);
      
      // Auto-switch to OTP verification after 2 seconds
      setTimeout(() => {
        onSwitchMode('verify-otp');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full animate-in fade-in duration-500">
      <div className="flex flex-col items-center mb-3">
        <div className="w-14 h-14 bg-[#ff7a00] rounded-[18px] flex items-center justify-center shadow-xl shadow-[#ff7a00]/30 mb-3">
           <Mail className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-2xl font-black text-[#001533]">Forgot Password?</h2>
        <p className="text-xs text-slate-500 mt-1 text-center">Enter your email to receive an OTP</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2 animate-in fade-in duration-300">
          <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-red-600 font-medium">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-start gap-2 animate-in fade-in duration-300">
          <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-green-600 font-medium">OTP sent successfully!</p>
            <p className="text-xs text-green-600 mt-1">Please check your email inbox for the OTP.</p>
          </div>
        </div>
      )}

      <Input
        label="Email Address"
        name="email"
        type="email"
        placeholder="yourname@domain.com"
        required
        icon={<Mail size={18} />}
        value={formData.email}
        onChange={handleChange}
        disabled={loading || success}
      />

      <button
        type="submit"
        disabled={loading || success}
        className="mt-2 w-full py-3.5 px-6 rounded-xl bg-[#ff7a00] text-white font-black text-sm tracking-widest shadow-lg shadow-[#ff7a00]/30 hover:bg-[#e66e00] hover:shadow-[#ff7a00]/40 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : success ? 'OTP SENT' : 'SEND OTP'}
      </button>

      <button
        type="button"
        onClick={() => onSwitchMode('login')}
        disabled={loading}
        className="mt-2 flex items-center justify-center gap-2 text-sm font-bold text-slate-600 hover:text-[#ff7a00] transition-colors disabled:opacity-50"
      >
        <ArrowLeft size={16} />
        Back to Login
      </button>
    </form>
  );
};

export default ForgotPasswordForm;
