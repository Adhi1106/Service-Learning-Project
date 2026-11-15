// The trust's mark: a small sun over a roof line ("Grace and Light").
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="#0f766e" />
      <circle cx="20" cy="17" r="5.5" fill="#fde68a" />
      <g stroke="#fde68a" strokeWidth="2" strokeLinecap="round">
        <path d="M20 6.5v2.5M10.5 17H8M32 17h-2.5M13.3 10.3l1.8 1.8M26.7 10.3l-1.8 1.8" />
      </g>
      <path d="M8 31 20 23l12 8" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark size={compact ? 30 : 36} />
      <div className="leading-tight">
        <p className={`font-semibold tracking-tight text-slate-900 ${compact ? "text-[15px]" : "text-base"}`}>CareTrack</p>
        <p className="text-xs text-slate-500">Grace and Light Trust</p>
      </div>
    </div>
  );
}
