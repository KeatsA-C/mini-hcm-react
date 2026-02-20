import { useState } from 'react';
import { UserPlus, LogIn, ChevronRight, CheckCircle2 } from 'lucide-react';

import InputField from '../InputField';
import Button from '../Button';

interface LoginProps {
  onSwitch: () => void;
  successMessage?: string | null;
}

export default function Login({ onSwitch, successMessage }: LoginProps): React.ReactElement {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const handleLogin = async (): Promise<void> => {
    await new Promise((r) => setTimeout(r, 2000));
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

      {/* Fields */}
      <div className="flex flex-col gap-4 mb-6">
        <InputField
          label="Email Address"
          placeholder="you@company.com"
          value={email}
          onChange={setEmail}
        />
        <InputField
          mode="password"
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChange={setPassword}
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
