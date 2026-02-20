import { useState } from 'react';
import { LogIn, LogOut } from 'lucide-react';

export type PunchState = 'in' | 'out';

interface PunchButtonProps {
  state: PunchState;
  onToggle: () => void | Promise<void>;
  disabled?: boolean;
}

export default function PunchButton({
  state,
  onToggle,
  disabled = false,
}: PunchButtonProps): React.ReactElement {
  const [loading, setLoading] = useState<boolean>(false);

  const handleClick = async (): Promise<void> => {
    if (disabled || loading) return;
    const result = onToggle();
    if (result instanceof Promise) {
      setLoading(true);
      try {
        await result;
      } finally {
        setLoading(false);
      }
    }
  };

  const isIn = state === 'in';

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Outer ring glow */}
      <div
        className={`
        relative rounded-full p-[3px] transition-all duration-500
        ${
          loading
            ? 'bg-white/10'
            : isIn
              ? 'bg-gradient-to-br from-green-500/40 via-green-500/10 to-transparent shadow-[0_0_32px_rgba(34,197,94,0.2)]'
              : 'bg-gradient-to-br from-red-500/40 via-red-500/10 to-transparent shadow-[0_0_32px_rgba(239,68,68,0.2)]'
        }
      `}
      >
        {/* Middle ring */}
        <div
          className={`
          rounded-full p-[3px] transition-all duration-500
          ${loading ? 'bg-white/5' : isIn ? 'bg-green-500/10' : 'bg-red-500/10'}
        `}
        >
          {/* Button */}
          <button
            onClick={handleClick}
            disabled={disabled || loading}
            className={`
              relative w-32 h-32 rounded-full
              flex flex-col items-center justify-center gap-1.5
              font-mono font-medium tracking-wide
              border transition-all duration-300 select-none outline-none
              disabled:cursor-not-allowed
              ${
                loading
                  ? 'bg-[#1c1c1c] border-white/10 text-neutral-600 cursor-wait'
                  : isIn
                    ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/15 hover:border-green-500/50 active:scale-95 cursor-pointer'
                    : 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/15 hover:border-red-500/50 active:scale-95 cursor-pointer'
              }
            `}
          >
            {loading ? (
              <>
                <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-neutral-500 animate-spin" />
                <span className="text-[10px] text-neutral-600 mt-1">Hold on...</span>
              </>
            ) : (
              <>
                {isIn ? (
                  <LogIn size={22} strokeWidth={1.5} />
                ) : (
                  <LogOut size={22} strokeWidth={1.5} />
                )}
                <span className="text-[13px]">{isIn ? 'PUNCH IN' : 'PUNCH OUT'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status label */}
      <div
        className={`
        flex items-center gap-1.5 px-3 py-1 rounded-full border
        font-mono text-[10px] tracking-[0.1em] uppercase
        transition-all duration-300
        ${
          isIn
            ? 'border-green-500/20 bg-green-500/5 text-green-500'
            : 'border-red-500/20 bg-red-500/5 text-red-500'
        }
      `}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${isIn ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}
        />
        {isIn ? 'Currently clocked out' : 'Currently clocked in'}
      </div>
    </div>
  );
}
