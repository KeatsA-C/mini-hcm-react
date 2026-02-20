import { useState } from 'react';
import Login from './Login';
import { Logo } from '../Logo';
import { Register } from './Register';

export default function AuthCard(): React.ReactElement {
  const [view, setView] = useState<'login' | 'register'>('login');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  return (
    <div className="relative w-full max-w-[420px]">
      <div className="absolute -inset-px rounded-xl bg-gradient-to-b from-white/[0.06] to-transparent pointer-events-none" />
      <div className="relative rounded-xl border border-white/[0.08] bg-[#1c1c1c] shadow-[0_8px_16px_rgba(175,175,175,0.25)] overflow-hidden">
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-blue-500/60 to-transparent" />
        <div className="p-8">
          {/* Logo / Brand */}
          <Logo />
          {view === 'login' ? (
            <Login
              onSwitch={() => {
                setSuccessMessage(null);
                setView('register');
              }}
              successMessage={successMessage}
            />
          ) : (
            <Register
              onSwitch={() => setView('login')}
              onSuccess={() => {
                setSuccessMessage('Registration Successful');
                setView('login');
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
