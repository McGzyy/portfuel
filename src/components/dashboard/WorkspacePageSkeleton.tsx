/** Generic workspace page skeleton — fits inside the persistent shell layout. */
export function WorkspacePageSkeleton({
  blocks = 3,
  wide = false,
}: {
  blocks?: number;
  wide?: boolean;
}) {
  return (
    <div className="pf-workspace-content animate-pulse space-y-4 sm:space-y-6">
      <div className="h-16 rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-[var(--pf-gray-100)]/80 sm:h-20" />
      {Array.from({ length: blocks }, (_, i) => (
        <div
          key={i}
          className={
            wide
              ? "h-72 rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-[var(--pf-gray-100)]/80"
              : "h-40 rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-[var(--pf-gray-100)]/80"
          }
        />
      ))}
    </div>
  );
}
