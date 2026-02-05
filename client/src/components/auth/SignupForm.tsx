import React, { useState, useEffect } from 'react';
import { User, Mail, Building2, Lock } from 'lucide-react';
import Input from './Input';
import PasswordStrength from './PasswordStrength';
import { SignupFormData } from '../../types/auth';
import api from '../../services/api';

interface SignupFormProps {
  onSwitchMode: (mode: 'login') => void;
}

interface Institution {
  id: string;
  name: string;
}

const SignupForm: React.FC<SignupFormProps> = ({ onSwitchMode }) => {
  const [formData, setFormData] = useState<SignupFormData>({
    name: '',
    email: '',
    organizationName: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loadingInstitutions, setLoadingInstitutions] = useState(true);
  const [filteredInstitutions, setFilteredInstitutions] = useState<Institution[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch institutions on component mount
  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        console.log('Fetching institutions from API...');
        const response = await api.get('/auth/institutions');
        console.log('Institutions API response:', response.data);
        
        if (response.data.success) {
          const sortedInstitutions = response.data.data.institutions.sort((a: Institution, b: Institution) => 
            a.name.localeCompare(b.name)
          );
          console.log('Sorted institutions:', sortedInstitutions);
          setInstitutions(sortedInstitutions);
          setFilteredInstitutions(sortedInstitutions);
        } else {
          console.error('API returned success: false');
        }
      } catch (err) {
        console.error('Failed to fetch institutions:', err);
        setError('Failed to load organizations. Please refresh the page.');
      } finally {
        setLoadingInstitutions(false);
      }
    };

    fetchInstitutions();
  }, []);

  // Filter institutions based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredInstitutions(institutions);
    } else {
      const filtered = institutions.filter(inst =>
        inst.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredInstitutions(filtered);
    }
  }, [searchTerm, institutions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/register', {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        organizationName: formData.organizationName,
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          onSwitchMode('login');
        }, 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setFormData(prev => ({ ...prev, organizationName: value }));
    setShowDropdown(true);
    setError('');
  };

  const handleSelectInstitution = (institutionName: string) => {
    setFormData(prev => ({ ...prev, organizationName: institutionName }));
    setSearchTerm(institutionName);
    setShowDropdown(false);
  };

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-xl shadow-green-500/30">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-[#001533]">Account Created!</h2>
        <p className="text-sm text-slate-500 text-center max-w-sm">
          Your account has been successfully created. You can now login with your credentials.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} autoComplete="off" className="flex flex-col gap-2 w-full animate-in fade-in slide-in-from-right duration-500">
      <div className="flex flex-col items-center mb-1">
        <div className="w-10 h-10 bg-[#ff7a00] rounded-[18px] flex items-center justify-center shadow-xl shadow-[#ff7a00]/30 mb-2 transform -rotate-2 hover:rotate-0 transition-transform cursor-pointer">
           <div className="w-3 h-3 bg-white rounded-full"></div>
        </div>
        <h2 className="text-lg font-black text-[#001533]">Sign Up</h2>
        <p className="text-[10px] text-slate-500 mt-0.5">Join the zero-queue revolution</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-1.5">
          <span className="text-xs text-red-600 font-medium">{error}</span>
        </div>
      )}

      <Input
        label="Full Name"
        name="name"
        type="text"
        placeholder="Alex Smith"
        required
        icon={<User size={18} />}
        value={formData.name}
        onChange={handleChange}
        autoComplete="off"
      />

      <Input
        label="Email Address"
        name="email"
        type="email"
        placeholder="alex@example.com"
        required
        icon={<Mail size={18} />}
        value={formData.email}
        onChange={handleChange}
        autoComplete="off"
      />

      <div className="flex flex-col gap-1">
        <label className="text-xs font-black text-[#001533] ml-0.5 tracking-wide uppercase opacity-70">
          ORGANISATION NAME <span className="text-red-500">*</span>
        </label>
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#ff7a00] transition-colors z-10">
            <Building2 size={18} />
          </div>
          <input
            type="text"
            name="organizationName"
            required
            value={searchTerm || formData.organizationName}
            onChange={handleSearchChange}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            disabled={loadingInstitutions}
            placeholder={loadingInstitutions ? 'Loading organizations...' : 'Type to search organizations...'}
            autoComplete="off"
            className="w-full pl-14 pr-3 py-2 rounded-xl border-2 border-slate-100 bg-white text-sm font-medium text-[#001533] placeholder:text-slate-400 focus:border-[#ff7a00] focus:outline-none focus:ring-4 focus:ring-[#ff7a00]/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:border-slate-200"
          />
          
          {/* Dropdown list */}
          {showDropdown && !loadingInstitutions && filteredInstitutions.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-white border-2 border-slate-100 rounded-xl shadow-lg max-h-60 overflow-y-auto">
              {filteredInstitutions.map((institution) => (
                <button
                  key={institution.id}
                  type="button"
                  onClick={() => handleSelectInstitution(institution.name)}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-[#001533] hover:bg-[#ff7a00]/5 hover:text-[#ff7a00] transition-colors first:rounded-t-xl last:rounded-b-xl"
                >
                  {institution.name}
                </button>
              ))}
            </div>
          )}
          
          {/* No results message */}
          {showDropdown && !loadingInstitutions && filteredInstitutions.length === 0 && searchTerm && (
            <div className="absolute z-20 w-full mt-1 bg-white border-2 border-slate-100 rounded-xl shadow-lg p-4">
              <p className="text-sm text-slate-500 text-center">No organizations found matching "{searchTerm}"</p>
            </div>
          )}
          
          {/* Show all institutions when no search term */}
          {showDropdown && !loadingInstitutions && institutions.length === 0 && !searchTerm && (
            <div className="absolute z-20 w-full mt-1 bg-white border-2 border-red-100 rounded-xl shadow-lg p-4">
              <p className="text-sm text-red-600 text-center font-medium">No organizations available. Please contact support.</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col">
        <Input
          label="Secure Password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
          icon={<Lock size={18} />}
          value={formData.password}
          onChange={handleChange}
          autoComplete="new-password"
        />
        <PasswordStrength password={formData.password} />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-0.5 w-full py-2.5 px-6 rounded-xl bg-[#ff7a00] text-white font-black text-sm tracking-widest shadow-lg shadow-[#ff7a00]/30 hover:bg-[#e66e00] hover:shadow-[#ff7a00]/40 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : 'CREATE ACCOUNT'}
      </button>

      <p className="text-center text-xs font-medium text-slate-500 mt-0">
        Already registered?{' '}
        <button
          type="button"
          onClick={() => onSwitchMode('login')}
          className="text-[#001533] font-black hover:underline"
        >
          Login
        </button>
      </p>
    </form>
  );
};

export default SignupForm;
