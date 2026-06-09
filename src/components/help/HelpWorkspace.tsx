"use client";

import { Suspense } from "react";
import { HelpDocsPanel } from "@/components/help/HelpDocsPanel";
import { HelpAssistantPanel } from "@/components/help/HelpAssistantPanel";
import { HelpNav } from "@/components/help/HelpNav";
import { HelpSectionPicker } from "@/components/help/HelpSectionPicker";
import { HelpSearchBar } from "@/components/help/HelpSearchBar";
import { SupportTicketsPanel } from "@/components/help/SupportTicketsPanel";
import { useAwaitingTicketCount } from "@/components/help/useAwaitingTicketCount";
import { getHelpSection, type HelpSectionId } from "@/lib/help/content";

function HelpWorkspaceInner({
  sectionId,
  ticketsView,
}: {
  sectionId: HelpSectionId;
  ticketsView: boolean;
}) {
  const section = getHelpSection(sectionId);
  const awaitingReplyCount = useAwaitingTicketCount();

  return (
    <div className="pf-help-page mx-auto max-w-5xl space-y-4 sm:space-y-6">
      <header className="px-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
          Support
        </p>
        <h1 className="mt-1 text-xl font-bold tracking-tight text-[var(--foreground)] sm:text-2xl">
          Help center
        </h1>
        <p className="mt-1 hidden text-sm text-[var(--pf-gray-500)] sm:block">
          Documentation, troubleshooting, and support tickets — built like a trading terminal reference.
        </p>
      </header>

      <HelpSearchBar />

      <HelpSectionPicker
        active={sectionId}
        ticketsView={ticketsView}
        awaitingReplyCount={awaitingReplyCount}
      />

      <div className="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-8">
        <div className="hidden lg:block">
          <HelpNav
            active={sectionId}
            ticketsView={ticketsView}
            awaitingReplyCount={awaitingReplyCount}
          />
        </div>

        <div className="min-w-0">
          {!ticketsView ? (
            <>
              <div className="mb-4 hidden lg:block">
                <h2 className="text-lg font-bold text-[var(--foreground)]">{section.label}</h2>
                <p className="mt-0.5 text-xs text-[var(--pf-gray-500)]">{section.description}</p>
              </div>
              <div className="space-y-4">
                <HelpAssistantPanel />
                <HelpDocsPanel sectionId={sectionId} />
              </div>
            </>
          ) : (
            <SupportTicketsPanel sectionId={sectionId} />
          )}
        </div>
      </div>
    </div>
  );
}

export function HelpWorkspace({
  sectionId,
  ticketsView,
}: {
  sectionId: HelpSectionId;
  ticketsView: boolean;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--pf-border)] border-t-[var(--pf-red)]" />
        </div>
      }
    >
      <HelpWorkspaceInner sectionId={sectionId} ticketsView={ticketsView} />
    </Suspense>
  );
}
