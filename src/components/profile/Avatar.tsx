interface AvatarProps {
  src?: string;
  name?: string;
  size?: number;
}

export default function Avatar({ src, name = 'JD', size = 88 }: AvatarProps): React.ReactElement {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="relative rounded-full ring-[3px] ring-white/[0.07] ring-offset-2 ring-offset-[#1c1c1c]"
      style={{ width: size, height: size }}
    >
      {src ? (
        <img src={src} alt={name} className="w-full h-full rounded-full object-cover" />
      ) : (
        <div className="w-full h-full rounded-full bg-[#242424] border border-white/10 flex items-center justify-center">
          {/* Gradient background */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/20 via-transparent to-purple-500/10" />
          <span
            className="relative font-sans font-semibold text-neutral-300 tracking-wide"
            style={{ fontSize: size * 0.28 }}
          >
            {initials}
          </span>
        </div>
      )}
    </div>
  );
}
