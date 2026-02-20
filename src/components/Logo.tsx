import { Building2 } from 'lucide-react';

export const Logo = () => {
  return (
    <div className="flex items-center gap-2.5 mb-8">
      <div className="w-8 h-8 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
        <Building2 size={15} className="text-blue-400" />
      </div>
      <div>
        <p className="font-sans text-[13px] font-semibold text-neutral-300 leading-none">HCM</p>
      </div>
    </div>
  );
};
