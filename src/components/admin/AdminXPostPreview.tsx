export type AdminXPostPreviewData = {
  lead: string;
  tail?: string;
  text: string;
  chartUrl: string;
  cacheKey: string;
  chartAlt?: string;
};

function chartPreviewSrc(chartUrl: string, cacheKey: string): string {
  const sep = chartUrl.includes("?") ? "&" : "?";
  return `${chartUrl}${sep}k=${cacheKey}`;
}

/** Dark X-style preview: copy above chart image (+ optional tail below). */
export function AdminXPostPreview({ preview }: { preview: AdminXPostPreviewData }) {
  const tail = preview.tail?.trim();

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--pf-border)] bg-[#0a0a0a] shadow-lg">
      <div className="border-b border-white/10 bg-[#111] px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
          X post preview
        </p>
        <pre className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-white">
          {preview.lead}
        </pre>
        <p className="mt-2 text-[10px] uppercase tracking-wide text-white/30">
          ↓ chart image attached below ↓
        </p>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={chartPreviewSrc(preview.chartUrl, preview.cacheKey)}
        alt={preview.chartAlt ?? "Social chart"}
        className="w-full"
      />
      {tail ? (
        <div className="border-t border-white/10 bg-[#111] px-4 py-3">
          <pre className="text-xs leading-relaxed whitespace-pre-wrap text-white/70">{tail}</pre>
          <p className="mt-2 text-[10px] text-white/35">
            Full tweet · {preview.text.length} / 280 chars
          </p>
        </div>
      ) : (
        <div className="border-t border-white/10 bg-[#111] px-4 py-3">
          <p className="text-[10px] text-white/35">
            Full tweet · {preview.text.length} / 280 chars
          </p>
        </div>
      )}
    </div>
  );
}
