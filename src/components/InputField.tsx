import { useState } from 'react';
import { Eye, EyeOff, ChevronDown } from 'lucide-react';

type InputMode = 'default' | 'password' | 'dropdown';

interface DropdownOption {
  label: string;
  value: string;
}

interface InputFieldProps {
  mode?: InputMode;
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  error?: string;
  options?: DropdownOption[];
}

export default function InputField({
  mode = 'default',
  label,
  placeholder,
  value,
  onChange,
  disabled = false,
  error,
  options = [],
}: InputFieldProps) {
  const [revealed, setRevealed] = useState<boolean>(false);
  const isPassword = mode === 'password';
  const isDropdown = mode === 'dropdown';
  const inputType = isPassword && !revealed ? 'password' : 'text';

  const baseClass = `
    w-full h-[42px] rounded-md
    bg-[#1a1a1a] border
    font-mono text-[13px] text-neutral-100
    px-3.5 outline-none
    transition-all duration-150
    focus:border-blue-500/50 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.10)]
    disabled:opacity-40 disabled:cursor-not-allowed
    ${error ? 'border-red-500/60 focus:border-red-500/60 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.10)]' : 'border-white/10'}
  `;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="font-mono text-[11px] tracking-[0.08em] uppercase text-neutral-500">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {isDropdown ? (
          <>
            <select
              value={value}
              disabled={disabled}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange?.(e.target.value)}
              className={`
                ${baseClass}
                pr-10 appearance-none cursor-pointer
                ${!value ? 'text-neutral-600' : ''}
              `}
            >
              {placeholder && (
                <option value="" disabled hidden>
                  {placeholder}
                </option>
              )}
              {options.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#1a1a1a] text-neutral-100">
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={15}
              className="absolute right-3 text-neutral-600 pointer-events-none"
            />
          </>
        ) : (
          <>
            <input
              type={inputType}
              value={value}
              placeholder={placeholder}
              disabled={disabled}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value)}
              className={`
                ${baseClass}
                placeholder:text-neutral-600 caret-blue-400
                ${isPassword ? 'pr-10' : ''}
              `}
            />
            {isPassword && (
              <button
                type="button"
                onClick={() => setRevealed((r) => !r)}
                className="absolute right-3 text-neutral-600 hover:text-neutral-400 transition-colors duration-150 outline-none"
                tabIndex={-1}
              >
                {revealed ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            )}
          </>
        )}
      </div>
      {error && <p className="font-mono text-[10px] text-red-400 tracking-wide">{error}</p>}
    </div>
  );
}
