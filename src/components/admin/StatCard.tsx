import React from 'react';

type Accent = 'blue' | 'green' | 'red' | 'purple' | 'amber';

const accentMap: Record<
  Accent,
  { bg: string; border: string; text: string; glow: string; blob: string }
> = {
  blue: {
    bg: 'bg-blue-500/[0.08]',
    border: 'border-blue-500/20',
    text: 'text-blue-400',
    glow: 'shadow-[0_0_24px_rgba(59,130,246,0.08)]',
    blob: 'bg-blue-500/10',
  },
  green: {
    bg: 'bg-green-500/[0.08]',
    border: 'border-green-500/20',
    text: 'text-green-400',
    glow: 'shadow-[0_0_24px_rgba(34,197,94,0.08)]',
    blob: 'bg-green-500/10',
  },
  red: {
    bg: 'bg-red-500/[0.08]',
    border: 'border-red-500/20',
    text: 'text-red-400',
    glow: 'shadow-[0_0_24px_rgba(239,68,68,0.08)]',
    blob: 'bg-red-500/10',
  },
  purple: {
    bg: 'bg-purple-500/[0.08]',
    border: 'border-purple-500/20',
    text: 'text-purple-400',
    glow: 'shadow-[0_0_24px_rgba(168,85,247,0.08)]',
    blob: 'bg-purple-500/10',
  },
  amber: {
    bg: 'bg-amber-500/[0.08]',
    border: 'border-amber-500/20',
    text: 'text-amber-400',
    glow: 'shadow-[0_0_24px_rgba(245,158,11,0.08)]',
    blob: 'bg-amber-500/10',
  },
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactElement;
  accent?: Accent;
  sublabel?: string;
}

export default function StatCard({ label, value, icon, accent = 'blue', sublabel }: StatCardProps) {
  const s = accentMap[accent];

  return (
    <div
      className={`relative rounded-xl border ${s.border} bg-[#1c1c1c] ${s.glow} px-5 py-4 flex flex-col gap-3 overflow-hidden`}
    >
      {/* background blob */}
      <div
        className={`absolute -top-4 -right-4 w-20 h-20 ${s.blob} blur-2xl rounded-full pointer-events-none`}
      />

      <div className="flex items-center justify-between relative z-10">
        <span className="font-mono text-[10px] text-neutral-500 tracking-widest uppercase">
          {label}
        </span>
        <span
          className={`${s.text} ${s.bg} p-1.5 rounded-md border ${s.border} flex items-center justify-center`}
        >
          {React.cloneElement(icon, { size: 14 })}
        </span>
      </div>

      <div className="relative z-10">
        <p className={`font-sans text-2xl font-bold ${s.text} leading-none`}>{value}</p>
        {sublabel && <p className="font-mono text-[10px] text-neutral-600 mt-1.5">{sublabel}</p>}
      </div>
    </div>
  );
}
