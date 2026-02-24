import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, LogIn, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';

import InputField from '../InputField';
import Button from '../Button';
import { firebaseLogin } from '../../store/authStore';

interface LoginProps {
  onSwitch: () => void;
  successMessage?: string | null;
}

export default function Login({ onSwitch, successMessage }: LoginProps): React.ReactElement {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<'email' | 'password', string>>>({});

  const validate = (): boolean => {
    const next: typeof errors = {};

    if (!email) next.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) next.email = 'Enter a valid email';
    if (!password) next.password = 'Password is required';
    else if (password.length < 8) next.password = 'Must be at least 8 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  };
  const handleLogin = async (): Promise<void> => {
    if (!validate()) return;
    setFirebaseError(null);
    const result = await firebaseLogin({
      email,
      password,
    });
    if (result.success) {
      navigate('/panel');
    } else {
      if (result.field) {
        setErrors((e) => ({ ...e, [result.field!]: result.message }));
      } else {
        setFirebaseError(result.message ?? 'Login failed');
      }
    }
  };

  return (
    <>
      {/* Heading */}
      <div className="mb-7">
        <h1 className="text-[22px] font-bold text-neutral-100 tracking-tight leading-tight">
          Sign in
        </h1>
      </div>

      {/* Registration success label */}
      {successMessage && (
        <div className="flex items-center gap-2 mb-5 px-3 py-2.5 rounded-md bg-green-500/10 border border-green-500/25">
          <CheckCircle2 size={13} className="text-green-400 shrink-0" />
          <p className="font-mono text-[11px] text-green-400">{successMessage}</p>
        </div>
      )}

      {/* Firebase error label */}
      {firebaseError && (
        <div className="flex items-center gap-2 mb-5 px-3 py-2.5 rounded-md bg-red-500/10 border border-red-500/25">
          <AlertCircle size={13} className="text-red-400 shrink-0" />
          <p className="font-mono text-[11px] text-red-400">{firebaseError}</p>
        </div>
      )}

      {/* Fields */}
      <div className="flex flex-col gap-4 mb-6">
        <InputField
          label="Email Address"
          placeholder="you@company.com"
          value={email}
          onChange={setEmail}
          error={errors.email}
        />
        <InputField
          mode="password"
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChange={setPassword}
          error={errors.password}
        />
      </div>

      {/* Forgot */}
      <div className="flex justify-end mb-6">
        <button className="font-mono text-[11px] text-neutral-600 hover:text-blue-400 transition-colors duration-150 tracking-wide">
          Forgot password?
        </button>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <Button mode="green" loadingLabel="Signing in..." onClick={handleLogin}>
          <LogIn size={14} />
          Sign In
        </Button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/[0.06]" />
          <span className="font-mono text-[10px] text-neutral-700 tracking-widest uppercase">
            or
          </span>
          <div className="flex-1 h-px bg-white/[0.06]" />
        </div>

        <Button mode="blue" onClick={onSwitch}>
          <UserPlus size={14} />
          Create an account
          <ChevronRight size={13} className="ml-auto opacity-50" />
        </Button>
      </div>
    </>
  );
}
