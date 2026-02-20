import { useState } from 'react';
import { CheckCircle2, XCircle, Shield, LogIn, ChevronRight, AlertCircle } from 'lucide-react';

import InputField from '../InputField';
import Button from '../Button';
import { registerUser } from '../../store/authStore';

interface RegisterProps {
  onSwitch: () => void;
  onSuccess: () => void;
}

export function Register({ onSwitch, onSuccess }: RegisterProps): React.ReactElement {
  const [firstname, setFirstname] = useState<string>('');
  const [lastname, setLastname] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [errors, setErrors] = useState<
    Partial<Record<'firstname' | 'lastname' | 'email' | 'password' | 'confirmPassword', string>>
  >({});
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!firstname) next.firstname = 'First name is required';
    if (!lastname) next.lastname = 'Last name is required';
    if (!email) next.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) next.email = 'Enter a valid email';
    if (!password) next.password = 'Password is required';
    else if (password.length < 8) next.password = 'Must be at least 8 characters';
    if (!confirmPassword) next.confirmPassword = 'Please confirm your password';
    else if (confirmPassword !== password) next.confirmPassword = 'Passwords do not match';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleRegister = async (): Promise<void> => {
    if (!validate()) return;
    setFirebaseError(null);
    const result = await registerUser({ firstname, lastname, email, password });
    if (result.success) {
      onSuccess();
    } else {
      if (result.field) {
        setErrors((e) => ({ ...e, [result.field!]: result.message }));
      } else {
        setFirebaseError(result.message ?? 'Registration failed');
      }
    }
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
        <div className="flex gap-4">
          <InputField
            label="First Name"
            placeholder="John"
            value={firstname}
            onChange={(v) => {
              setFirstname(v);
              setErrors((e) => ({ ...e, firstname: undefined }));
            }}
            error={errors.firstname}
          />
          <InputField
            label="Last Name"
            placeholder="Doe"
            value={lastname}
            onChange={(v) => {
              setLastname(v);
              setErrors((e) => ({ ...e, lastname: undefined }));
            }}
            error={errors.lastname}
          />
        </div>
        <InputField
          label="Work Email"
          placeholder="you@company.com"
          value={email}
          onChange={(v) => {
            setEmail(v);
            setErrors((e) => ({ ...e, email: undefined }));
          }}
          error={errors.email}
        />
        <InputField
          mode="password"
          label="Password"
          placeholder="Min. 8 characters"
          value={password}
          onChange={(v) => {
            setPassword(v);
            setErrors((e) => ({ ...e, password: undefined }));
          }}
          error={errors.password}
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
            onChange={(v) => {
              setConfirmPassword(v);
              setErrors((e) => ({ ...e, confirmPassword: undefined }));
            }}
            error={errors.confirmPassword}
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

      {/* Firebase error banner */}
      {firebaseError && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-md bg-red-500/10 border border-red-500/25">
          <AlertCircle size={13} className="text-red-400 shrink-0" />
          <p className="font-mono text-[11px] text-red-400">{firebaseError}</p>
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
