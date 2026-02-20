import { useState } from 'react';
import { Loader2 } from 'lucide-react';

type ButtonMode = 'green' | 'red' | 'blue' | 'inactive' | 'loading';

interface ButtonProps {
  mode?: ButtonMode;
  children?: React.ReactNode;
  onClick?: () => void | Promise<void>;
  loadingLabel?: string;
}

const buttonStyles: Record<ButtonMode, string> = {
  green:
    'bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 hover:border-green-500/50 hover:shadow-[0_0_16px_rgba(34,197,94,0.25)] active:translate-y-px cursor-pointer',
  red: 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 hover:shadow-[0_0_16px_rgba(239,68,68,0.25)] active:translate-y-px cursor-pointer',
  blue: 'bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/50 hover:shadow-[0_0_16px_rgba(59,130,246,0.25)] active:translate-y-px cursor-pointer',
  inactive: 'bg-white/5 border border-white/[0.07] text-neutral-600 cursor-not-allowed',
  loading: 'bg-white/5 border border-white/10 text-neutral-500 cursor-wait',
};

export default function Button({
  mode = 'blue',
  children,
  onClick,
  loadingLabel = 'Processing...',
}: ButtonProps) {
  const [internalLoading, setInternalLoading] = useState<boolean>(false);

  const resolvedMode: ButtonMode = internalLoading ? 'loading' : mode;
  const isDisabled = resolvedMode === 'inactive' || resolvedMode === 'loading';

  const handleClick = async (): Promise<void> => {
    if (!onClick || isDisabled) return;
    const result = onClick();
    if (result instanceof Promise) {
      setInternalLoading(true);
      try {
        await result;
      } finally {
        setInternalLoading(false);
      }
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center gap-2
        h-10 px-5 rounded-md
        font-mono text-[13px] font-medium tracking-[0.04em]
        transition-all duration-150 select-none outline-none
        ${buttonStyles[resolvedMode]}
      `}
    >
      {resolvedMode === 'loading' ? (
        <>
          <Loader2 size={14} className="animate-spin shrink-0" />
          <span>{loadingLabel}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
