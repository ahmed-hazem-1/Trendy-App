export default function Divider({ text }) {
  return (
    <div className="flex items-center gap-3 my-6">
      <span className="flex-1 h-px bg-border-glass" />
      {text && (
        <span className="text-[11px] font-medium tracking-widest text-text-muted uppercase">
          {text}
        </span>
      )}
      <span className="flex-1 h-px bg-border-glass" />
    </div>
  );
}
