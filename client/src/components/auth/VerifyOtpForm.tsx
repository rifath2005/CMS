import React, { useState } from 'react';
import { Shield, ArrowLeft } from 'lucide-react';
import { VerifyOtpData } from '../../types/auth';

interface VerifyOtpFormProps {
  email: string;
  onSwitchMode: (mode: 'forgot-password' | 'reset-password') => void;
  onTokenReceived: (token: string) => void;
}

const VerifyOtpForm: React.FC<VerifyOtpFormProps> = ({ email, onSwitchMode, onTokenReceived }) => {
  const [formData, setFormData] = useState<VerifyOtpData>({
    otp: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/v1/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp: formData.otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Invalid OTP');
      }

      // Store reset token and proceed
      onTokenReceived(data.data.resetToken);
      onSwitchMode('reset-password');
    } catch (err: any) {
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setFormData({ otp: value });
    setError('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full animate-in fade-in duration-500">
      <div className="flex flex-col items-center mb-3">
        <div className="w-14 h-14 bg-[#ff7a00] rounded-[18px] flex items-center justify-center shadow-xl shadow-[#ff7a00]/30 mb-3">
           <Shield className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-2xl font-black text-[#001533]">Verify OTP</h2>
        <p className="text-xs text-slate-500 mt-1 text-center">
          Enter the 6-digit code sent to<br />
          <span className="font-bold text-slate-700">{email}</span>
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-slate-800 ml-1">
          OTP Code <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="otp"
          placeholder="123456"
          required
          maxLength={6}
          pattern="[0-9]{6}"
          value={formData.otp}
          onChange={handleChange}
          className="w-full py-3 px-4 rounded-xl border-2 border-slate-100 bg-white transition-all outline-none font-bold text-center text-2xl tracking-widest focus:border-[#ff7a00] focus:ring-4 focus:ring-[#ff7a00]/10 hover:border-slate-200"
        />
        {error && <span className="text-xs text-red-500 font-medium ml-1">{error}</span>}
      </div>

      <button
        type="submit"
        disabled={loading || formData.otp.length !== 6}
        className="mt-2 w-full py-3.5 px-6 rounded-xl bg-[#ff7a00] text-white font-black text-sm tracking-widest shadow-lg shadow-[#ff7a00]/30 hover:bg-[#e66e00] hover:shadow-[#ff7a00]/40 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : 'VERIFY OTP'}
      </button>

      <button
        type="button"
        onClick={() => onSwitchMode('forgot-password')}
        className="mt-2 flex items-center justify-center gap-2 text-sm font-bold text-slate-600 hover:text-[#ff7a00] transition-colors"
      >
        <ArrowLeft size={16} />
        Back
      </button>
    </form>
  );
};

export default VerifyOtpForm;
