"use client";

import type { ReactNode } from "react";
import type { DiscordEmbedPayload } from "@/lib/discord/embed-payloads";

function embedColorHex(color?: number): string {
  if (color == null) return "#4e5058";
  return `#${color.toString(16).padStart(6, "0")}`;
}

function parseDiscordInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|_[^_]+_|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];
    if (token.startsWith("**")) {
      nodes.push(
        <strong key={key++} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("_")) {
      nodes.push(
        <em key={key++} className="text-[#b5bac1]">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith("`")) {
      nodes.push(
        <code key={key++} className="rounded bg-[#1e1f22] px-1 py-0.5 text-[12px] text-[#dbdee1]">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("[")) {
      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      if (link) {
        nodes.push(
          <a
            key={key++}
            href={link[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#00a8fc] hover:underline"
          >
            {link[1]}
          </a>
        );
      } else {
        nodes.push(token);
      }
    } else {
      nodes.push(token);
    }
    last = match.index + token.length;
  }

  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function DiscordMarkdown({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1 text-[13px] leading-[1.375] text-[#dbdee1]">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        if (line.startsWith("> ")) {
          return (
            <blockquote
              key={i}
              className="border-l-2 border-[#4e5058] pl-2 text-[#b5bac1]"
            >
              {parseDiscordInline(line.slice(2))}
            </blockquote>
          );
        }
        return (
          <p key={i}>{parseDiscordInline(line)}</p>
        );
      })}
    </div>
  );
}

function DiscordEmbedCard({ embed }: { embed: DiscordEmbedPayload }) {
  const accent = embedColorHex(embed.color);

  return (
    <div
      className="relative overflow-hidden rounded-r-md bg-[#2b2d31] pl-3"
      style={{ borderLeft: `4px solid ${accent}` }}
    >
      <div className="px-3 py-2.5 pr-3">
        {embed.author?.name ? (
          <p className="mb-1 text-xs font-medium text-[#dbdee1]">
            {embed.author.url ? (
              <a
                href={embed.author.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {embed.author.name}
              </a>
            ) : (
              embed.author.name
            )}
          </p>
        ) : null}

        <div className={embed.thumbnail?.url ? "pr-16" : undefined}>
          {embed.title ? (
            <p className="text-sm font-semibold text-[#f2f3f5]">
              {embed.url ? (
                <a
                  href={embed.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {embed.title}
                </a>
              ) : (
                embed.title
              )}
            </p>
          ) : null}

          {embed.description ? (
            <div className={embed.title ? "mt-1.5" : undefined}>
              <DiscordMarkdown text={embed.description} />
            </div>
          ) : null}

          {embed.fields?.length ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {embed.fields.map((field) => (
                <div
                  key={`${field.name}-${field.value}`}
                  className={field.inline ? undefined : "sm:col-span-2"}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#b5bac1]">
                    {field.name}
                  </p>
                  <div className="mt-0.5 text-[13px] leading-snug text-[#dbdee1]">
                    {parseDiscordInline(field.value)}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {embed.footer?.text ? (
            <p className="mt-3 text-[11px] text-[#949ba4]">{embed.footer.text}</p>
          ) : null}
        </div>

        {embed.thumbnail?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={embed.thumbnail.url}
            alt=""
            className="absolute right-3 top-3 h-14 w-14 rounded-md object-cover"
          />
        ) : null}
      </div>
    </div>
  );
}

export function DiscordMessagePreview({
  content,
  embeds,
  attachChart,
  chartUrl,
  note,
}: {
  content?: string;
  embeds: DiscordEmbedPayload[];
  attachChart?: boolean;
  chartUrl?: string;
  note?: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#1e1f22] bg-[#313338] shadow-lg">
      <div className="border-b border-[#1e1f22] bg-[#2b2d31] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--pf-red)] text-xs font-bold text-white">
            PF
          </div>
          <div>
            <p className="text-sm font-semibold text-[#f2f3f5]">PortFuel</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#949ba4]">
              Bot · APP
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 px-4 py-4">
        {content ? (
          <div className="text-[15px] leading-relaxed text-[#dbdee1]">
            <DiscordMarkdown text={content} />
          </div>
        ) : null}

        {embeds.map((embed, i) => (
          <DiscordEmbedCard key={`${embed.title ?? "embed"}-${i}`} embed={embed} />
        ))}

        {attachChart && chartUrl ? (
          <div className="overflow-hidden rounded-lg border border-[#1e1f22]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={chartUrl} alt="Milestone chart attachment" className="w-full" />
            <p className="bg-[#2b2d31] px-3 py-2 text-[10px] uppercase tracking-wide text-[#949ba4]">
              Chart attachment (demo)
            </p>
          </div>
        ) : null}

        {note ? <p className="text-xs text-[#949ba4]">{note}</p> : null}
      </div>
    </div>
  );
}
