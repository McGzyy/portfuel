export function DmTypingIndicator({ name }: { name: string }) {
  return (
    <div
      className="flex justify-start"
      role="status"
      aria-live="polite"
      aria-label={`${name} is typing`}
    >
      <div className="rounded-2xl bg-[var(--pf-gray-100)] px-3 py-2">
        <p className="text-[10px] font-medium text-[var(--pf-gray-500)]">{name} is typing</p>
        <div className="mt-1.5 flex gap-1">
          <span className="pf-dm-typing-dot h-1.5 w-1.5 rounded-full bg-[var(--pf-gray-400)]" />
          <span className="pf-dm-typing-dot pf-dm-typing-dot-delay-1 h-1.5 w-1.5 rounded-full bg-[var(--pf-gray-400)]" />
          <span className="pf-dm-typing-dot pf-dm-typing-dot-delay-2 h-1.5 w-1.5 rounded-full bg-[var(--pf-gray-400)]" />
        </div>
      </div>
    </div>
  );
}
