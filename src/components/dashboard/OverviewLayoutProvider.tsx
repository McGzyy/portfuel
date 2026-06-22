"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  defaultOverviewLayoutPrefs,
  dispatchOverviewLayoutChanged,
  isMobileOverviewViewport,
  isOverviewPanelVisible,
  readOverviewLayoutPrefs,
  writeOverviewLayoutPrefs,
  type OverviewDensity,
  type OverviewFocusMode,
  type OverviewLayoutPrefs,
  type OverviewPanelId,
} from "@/lib/workspace/overview-layout";

type OverviewLayoutContextValue = {
  prefs: OverviewLayoutPrefs;
  customizeOpen: boolean;
  setCustomizeOpen: (open: boolean) => void;
  setFocus: (focus: OverviewFocusMode) => void;
  setDensity: (density: OverviewDensity) => void;
  setPanelVisible: (panelId: OverviewPanelId, visible: boolean) => void;
  resetLayout: () => void;
  isPanelVisible: (panelId: OverviewPanelId) => boolean;
  densityClass: string;
};

const OverviewLayoutContext = createContext<OverviewLayoutContextValue | null>(null);

export function OverviewLayoutProvider({
  userId,
  isPro = false,
  children,
}: {
  userId: string;
  isPro?: boolean;
  children: ReactNode;
}) {
  const [prefs, setPrefs] = useState<OverviewLayoutPrefs>(() =>
    defaultOverviewLayoutPrefs({ isPro })
  );
  const [customizeOpen, setCustomizeOpen] = useState(false);

  useEffect(() => {
    setPrefs(readOverviewLayoutPrefs(userId, { isPro }));
  }, [userId, isPro]);

  const persist = useCallback(
    (next: OverviewLayoutPrefs) => {
      setPrefs(next);
      writeOverviewLayoutPrefs(userId, next);
      dispatchOverviewLayoutChanged();
    },
    [userId]
  );

  const setFocus = useCallback(
    (focus: OverviewFocusMode) => {
      persist({ ...prefs, focus, panelOverrides: {} });
    },
    [persist, prefs]
  );

  const setDensity = useCallback(
    (density: OverviewDensity) => {
      persist({ ...prefs, density });
    },
    [persist, prefs]
  );

  const setPanelVisible = useCallback(
    (panelId: OverviewPanelId, visible: boolean) => {
      persist({
        ...prefs,
        panelOverrides: { ...prefs.panelOverrides, [panelId]: visible },
      });
    },
    [persist, prefs]
  );

  const resetLayout = useCallback(() => {
    persist(
      defaultOverviewLayoutPrefs({ mobile: isMobileOverviewViewport(), isPro })
    );
  }, [persist, isPro]);

  const isVisible = useCallback(
    (panelId: OverviewPanelId) => isOverviewPanelVisible(panelId, prefs),
    [prefs]
  );

  const densityClass = prefs.density === "compact" ? "space-y-4" : "space-y-6";

  const value = useMemo<OverviewLayoutContextValue>(
    () => ({
      prefs,
      customizeOpen,
      setCustomizeOpen,
      setFocus,
      setDensity,
      setPanelVisible,
      resetLayout,
      isPanelVisible: isVisible,
      densityClass,
    }),
    [
      prefs,
      customizeOpen,
      setFocus,
      setDensity,
      setPanelVisible,
      resetLayout,
      isVisible,
      densityClass,
    ]
  );

  return (
    <OverviewLayoutContext.Provider value={value}>{children}</OverviewLayoutContext.Provider>
  );
}

export function useOverviewLayout(): OverviewLayoutContextValue {
  const ctx = useContext(OverviewLayoutContext);
  if (!ctx) {
    throw new Error("useOverviewLayout must be used within OverviewLayoutProvider");
  }
  return ctx;
}

export function useOverviewLayoutOptional(): OverviewLayoutContextValue | null {
  return useContext(OverviewLayoutContext);
}
