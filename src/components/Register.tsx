import { useState } from 'react';
import { CheckCircle2, XCircle, Shield, LogIn, ChevronRight } from 'lucide-react';

import InputField from './InputField';
import Button from './Button';

interface RegisterProps {
  onSwitch: () => void;
}

export function Register({ onSwitch }: RegisterProps): React.ReactElement {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  const handleRegister = async (): Promise<void> => {
    await new Promise((r) => setTimeout(r, 2500));
  };

  // Live confirm match indicator
  const passwordsMatch = confirmPassword.length > 0 && confirmPassword === password;
  const passwordsMismatch = confirmPassword.length > 0 && confirmPassword !== password;

  return (
    <>
      {/* Heading */}
      <div className="mb-7">
        <h1 className="text-[22px] font-bold text-neutral-100 tracking-tight leading-tight">
          Create account
        </h1>
      </div>

      {/* Fields */}
      <div className="flex flex-col gap-4 mb-6">
        <InputField
          label="Work Email"
          placeholder="you@company.com"
          value={email}
          onChange={setEmail}
        />
        <InputField
          mode="password"
          label="Password"
          placeholder="Min. 8 characters"
          value={password}
          onChange={setPassword}
        />

        {/* Confirm Password — custom wrapper for match indicator */}
        <div className="flex flex-col gap-1.5 w-full">
          <div className="flex items-center justify-between">
            <label className="font-mono text-[11px] tracking-[0.08em] uppercase text-neutral-500">
              Confirm Password
            </label>
            {passwordsMatch && (
              <span className="font-mono text-[10px] text-green-400 flex items-center gap-1">
                <CheckCircle2 size={11} /> Passwords match
              </span>
            )}
            {passwordsMismatch && (
              <span className="font-mono text-[10px] text-red-400 flex items-center gap-1">
                <XCircle size={11} /> No match
              </span>
            )}
          </div>
          <InputField
            mode="password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={setConfirmPassword}
          />
        </div>
      </div>

      {/* Strength hint */}
      {password.length > 0 && (
        <div className="mb-5">
          <div className="flex gap-1 mb-1.5">
            {[1, 2, 3, 4].map((level) => {
              const strength =
                password.length >= 12 &&
                /[A-Z]/.test(password) &&
                /[0-9]/.test(password) &&
                /[^A-Za-z0-9]/.test(password)
                  ? 4
                  : password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password)
                    ? 3
                    : password.length >= 8
                      ? 2
                      : 1;
              return (
                <div
                  key={level}
                  className={`h-[3px] flex-1 rounded-full transition-all duration-300 ${
                    level <= strength
                      ? strength === 1
                        ? 'bg-red-500'
                        : strength === 2
                          ? 'bg-amber-500'
                          : strength === 3
                            ? 'bg-blue-400'
                            : 'bg-green-400'
                      : 'bg-white/[0.06]'
                  }`}
                />
              );
            })}
          </div>
          <p className="font-mono text-[10px] text-neutral-600 tracking-wide">
            {password.length < 8
              ? 'Too short'
              : password.length < 10
                ? 'Weak — add numbers or symbols'
                : password.length < 12
                  ? 'Moderate'
                  : 'Strong password'}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <Button mode="green" loadingLabel="Creating account..." onClick={handleRegister}>
          <Shield size={14} />
          Create Account
        </Button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/[0.06]" />
          <span className="font-mono text-[10px] text-neutral-700 tracking-widest uppercase">
            or
          </span>
          <div className="flex-1 h-px bg-white/[0.06]" />
        </div>

        <Button mode="blue" onClick={onSwitch}>
          <LogIn size={14} />
          Back to sign in
          <ChevronRight size={13} className="ml-auto opacity-50" />
        </Button>
      </div>

      {/* Footer */}
      <p className="font-mono text-[10px] text-neutral-700 text-center mt-6 tracking-wide">
        By registering you agree to our Terms of Service
      </p>
    </>
  );
}
