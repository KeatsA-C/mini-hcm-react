import { useState } from 'react';
import { Clock, Calendar, Building2 } from 'lucide-react';
import Avatar from './Avatar';
import PunchButton, { type PunchState } from './PunchButton';
interface ProfileProps {
  name?: string;
  role?: string;
  department?: string;

  avatarSrc?: string;
}

export default function Profile({
  name = 'John Doe',
  role = 'Senior HR Specialist',
  department = 'Human Resources',

  avatarSrc,
}: ProfileProps): React.ReactElement {
  const [punchState, setPunchState] = useState<PunchState>('in');
  const [punchLog, setPunchLog] = useState<string>('Not yet punched today');

  const handlePunch = async (): Promise<void> => {
    await new Promise((r) => setTimeout(r, 1800));
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    if (punchState === 'in') {
      setPunchLog(`Punched in at ${now}`);
      setPunchState('out');
    } else {
      setPunchLog(`Punched out at ${now}`);
      setPunchState('in');
    }
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="relative w-full max-w-[360px]">
      {/* Card glow */}
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />

      <div className="relative rounded-2xl border border-white/[0.08] bg-[#1c1c1c] overflow-hidden shadow-[0_32px_64px_rgba(0,0,0,0.6)]">
        {/* Top accent */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

        {/* Header band */}
        <div className="relative h-24 bg-gradient-to-br from-blue-500/[0.07] via-transparent to-purple-500/[0.05]">
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '20px 20px',
            }}
          />
        </div>

        {/* Avatar — overlaps header */}
        <div className="flex justify-center -mt-11 mb-4 relative z-10">
          <Avatar src={avatarSrc} name={name} size={88} />
        </div>

        {/* Identity */}
        <div className="flex flex-col items-center gap-1 px-6 mb-5">
          <h1 className="font-sans text-[18px] font-bold text-neutral-100 tracking-tight">
            {name}
          </h1>
          <p className="font-mono text-[12px] text-neutral-500 tracking-wide">{role}</p>

          {/* Tags */}
          <div className="flex items-center gap-2 mt-2 flex-wrap justify-center">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/[0.08] border border-blue-500/20 font-mono text-[10px] text-blue-400 tracking-wide">
              <Building2 size={9} /> {department}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-6 h-px bg-white/[0.05] mb-5" />

        {/* Punch Button */}
        <div className="flex flex-col items-center px-6 mb-5">
          <PunchButton state={punchState} onToggle={handlePunch} />
        </div>

        {/* Divider */}
        <div className="mx-6 h-px bg-white/[0.05] mb-4" />

        {/* Footer meta */}
        <div className="flex items-center justify-between px-6 pb-5">
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-neutral-700">
            <Calendar size={11} />
            <span>{today}</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-neutral-700">
            <Clock size={11} />
            <span>{punchLog}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
