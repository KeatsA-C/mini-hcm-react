import { Calendar, Clock, AlertCircle } from 'lucide-react';

interface SkeletonProps {
  className?: string;
}

function Skeleton({ className = '' }: SkeletonProps): React.ReactElement {
  return (
    <div
      className={`
        relative overflow-hidden bg-white/[0.05]
        before:absolute before:inset-0
        before:bg-gradient-to-r before:from-transparent before:via-white/[0.07] before:to-transparent
        before:translate-x-[-100%] before:animate-[shimmer_1.6s_infinite]
        ${className}
      `}
    />
  );
}

interface ProfileSkeletonProps {
  errorMessage?: string | null;
}

export function ProfileSkeleton({ errorMessage }: ProfileSkeletonProps = {}): React.ReactElement {
  return (
    <div className="relative w-full max-w-[360px]">
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>

      {/* Card glow */}
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />

      <div className="relative rounded-2xl border border-white/[0.08] bg-[#1c1c1c] overflow-hidden shadow-[0_8px_16px_rgba(175,175,175,0.25)]">
        {/* Top accent */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Header band */}
        <div className="relative h-24 bg-white/[0.02]">
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '20px 20px',
            }}
          />
        </div>

        {/* Avatar skeleton — overlaps header */}
        <div className="flex justify-center -mt-11 mb-4 relative z-10 ">
          <div className="relative ">
            <Skeleton className="w-24 h-24 rounded-full ring-[3px] ring-white/[0.04] ring-offset-2 ring-offset-[#1c1c1c]" />
          </div>
        </div>

        {/* Identity skeleton */}
        <div className="flex flex-col items-center gap-2 px-6 mb-5">
          {/* Full name */}
          <Skeleton className="w-36 h-5 rounded-md" />
          {/* position */}
          <Skeleton className="w-44 h-3.5 rounded-md" />

          {/* Tags */}
          <div className="flex items-center gap-2 mt-2">
            <Skeleton className="w-28 h-5 rounded-full" />
            <Skeleton className="w-24 h-5 rounded-full" />
          </div>
        </div>

        {/* Divider */}
        <div className="mx-6 h-px bg-white/[0.05] mb-5" />

        {/* Error message */}
        {errorMessage && (
          <div className="flex items-center justify-center gap-2 mx-6 mb-5 px-4 py-3 rounded-md bg-red-500/10 border border-red-500/25">
            <AlertCircle size={14} className="text-red-400 shrink-0" />
            <p className="font-mono text-[11px] text-red-400 text-center">{errorMessage}</p>
          </div>
        )}

        {/* Punch Button skeleton */}
        <div className="flex flex-col items-center gap-3 px-6 mb-5">
          {/* Outer glow ring */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative rounded-full p-[3px] bg-white/[0.03]">
              <div className="rounded-full p-[3px] bg-white/[0.02]">
                <Skeleton className="w-32 h-32 rounded-full" />
              </div>
            </div>
            {/* Status pill */}
            <Skeleton className="w-40 h-5 rounded-full" />
          </div>

          {/* Logout button skeleton */}
          <Skeleton className="w-24 h-10 rounded-md" />
        </div>

        {/* Divider */}
        <div className="mx-6 h-px bg-white/[0.05] mb-4" />

        {/* Footer meta skeleton */}
        <div className="flex items-center justify-between px-6 pb-5">
          <div className="flex items-center gap-1.5">
            <Calendar size={11} className="text-white/[0.08]" />
            <Skeleton className="w-20 h-3 rounded-md" />
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={11} className="text-white/[0.08]" />
            <Skeleton className="w-28 h-3 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
