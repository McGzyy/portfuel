"use client";

import { useEffect, useState } from "react";
import { LayoutGrid, RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useOverviewLayout } from "@/components/dashboard/OverviewLayoutProvider";
import {
  ALL_OVERVIEW_PANEL_IDS,
  OVERVIEW_FOCUS_DESCRIPTIONS,
  OVERVIEW_FOCUS_LABELS,
  OVERVIEW_LAYOUT_OPEN_EVENT,
  OVERVIEW_PANEL_LABELS,
  type OverviewFocusMode,
  type OverviewPanelId,
} from "@/lib/workspace/overview-layout";
import { cn } from "@/lib/utils";

const FOCUS_OPTIONS: { value: OverviewFocusMode; label: string }[] = (
  Object.keys(OVERVIEW_FOCUS_LABELS) as OverviewFocusMode[]
).map((value) => ({
  value,
  label: OVERVIEW_FOCUS_LABELS[value],
}));

function PanelToggle({
  panelId,
  visible,
  onChange,
}: {
  panelId: OverviewPanelId;
  visible: boolean;
  onChange: (visible: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-surface)] px-3 py-2 text-sm">
      <input
        type="checkbox"
        checked={visible}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-[var(--pf-border)] text-[var(--pf-red)] focus:ring-[var(--pf-red)]"
      />
      <span className="font-medium text-[var(--pf-black)]">{OVERVIEW_PANEL_LABELS[panelId]}</span>
    </label>
  );
}

function LayoutBarContent({ onClose }: { onClose?: () => void }) {
  const {
    prefs,
    customizeOpen,
    setCustomizeOpen,
    setFocus,
    setDensity,
    setPanelVisible,
    resetLayout,
    isPanelVisible,
  } = useOverviewLayout();

  const focusHint =
    prefs.focus !== "default" ? OVERVIEW_FOCUS_DESCRIPTIONS[prefs.focus] : null;

  return (
    <section
      className="rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-[var(--pf-surface)] px-4 py-3 shadow-[var(--pf-shadow-sm)] sm:px-5"
      aria-label="Overview layout"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <LayoutGrid className="h-4 w-4 shrink-0 text-[var(--pf-gray-500)]" strokeWidth={2.25} />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[var(--pf-black)]">Overview layout</p>
            {focusHint ? (
              <p className="truncate text-[10px] text-[var(--pf-gray-500)]">{focusHint}</p>
            ) : (
              <p className="text-[10px] text-[var(--pf-gray-500)]">Focus presets and panel visibility</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl
            value={prefs.density}
            onChange={setDensity}
            options={[
              { value: "comfortable", label: "Comfortable" },
              { value: "compact", label: "Compact" },
            ]}
            className="w-auto min-w-[12rem]"
          />
          <Button
            type="button"
            size="sm"
            variant={customizeOpen ? "default" : "secondary"}
            onClick={() => setCustomizeOpen(!customizeOpen)}
          >
            <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" strokeWidth={2.25} />
            Customize
          </Button>
          {onClose ? (
            <Button type="button" size="sm" variant="secondary" onClick={onClose} aria-label="Close">
              <X className="h-3.5 w-3.5" strokeWidth={2.25} />
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-3 overflow-x-auto pb-0.5">
        <SegmentedControl value={prefs.focus} onChange={setFocus} options={FOCUS_OPTIONS} />
      </div>

      {customizeOpen ? (
        <div className="mt-4 space-y-3 border-t border-[var(--pf-border)] pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--pf-gray-500)]">
              Panels
            </p>
            <Button type="button" size="sm" variant="secondary" onClick={resetLayout}>
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" strokeWidth={2.25} />
              Reset
            </Button>
          </div>
          <div
            className={cn(
              "grid gap-2 sm:grid-cols-2 lg:grid-cols-3",
              prefs.density === "compact" && "gap-1.5"
            )}
          >
            {ALL_OVERVIEW_PANEL_IDS.map((panelId) => (
              <PanelToggle
                key={panelId}
                panelId={panelId}
                visible={isPanelVisible(panelId)}
                onChange={(visible) => setPanelVisible(panelId, visible)}
              />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function OverviewLayoutBar() {
  const { prefs, setCustomizeOpen } = useOverviewLayout();
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const open = () => {
      setExpanded(true);
      setCustomizeOpen(true);
    };
    if (window.sessionStorage.getItem("pf_overview_layout_open") === "1") {
      window.sessionStorage.removeItem("pf_overview_layout_open");
      open();
    }
    window.addEventListener(OVERVIEW_LAYOUT_OPEN_EVENT, open);
    return () => window.removeEventListener(OVERVIEW_LAYOUT_OPEN_EVENT, open);
  }, [setCustomizeOpen]);

  function close() {
    setExpanded(false);
    setCustomizeOpen(false);
  }

  if (!expanded) {
    return (
      <div className="flex items-center justify-end gap-3">
        <span className="text-[11px] font-medium text-[var(--pf-gray-400)]">
          {OVERVIEW_FOCUS_LABELS[prefs.focus]} focus
        </span>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-[var(--pf-gray-500)] transition-colors hover:bg-[var(--pf-gray-100)] hover:text-[var(--pf-black)]"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={2.25} />
          Customize overview
        </button>
      </div>
    );
  }

  return <LayoutBarContent onClose={close} />;
}
