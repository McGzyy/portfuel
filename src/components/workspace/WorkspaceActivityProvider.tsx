"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { isDemoMode } from "@/lib/demo/config";
import {
  dispatchWorkspaceActivity,
  type WorkspaceActivitySnapshot,
} from "@/lib/workspace/activity-events";

export type WorkspaceStreamStatus = "idle" | "connecting" | "live" | "offline";

type WorkspaceActivityContextValue = WorkspaceActivitySnapshot & {
  streamStatus: WorkspaceStreamStatus;
};

const WorkspaceActivityContext = createContext<WorkspaceActivityContextValue | null>(null);

export function WorkspaceActivityProvider({
  initial,
  children,
}: {
  initial: WorkspaceActivitySnapshot;
  children: ReactNode;
}) {
  const [snapshot, setSnapshot] = useState(initial);
  const [streamStatus, setStreamStatus] = useState<WorkspaceStreamStatus>("idle");
  const snapshotRef = useRef(initial);

  const applySnapshot = useCallback((next: WorkspaceActivitySnapshot) => {
    snapshotRef.current = next;
    setSnapshot(next);
    dispatchWorkspaceActivity(next);
  }, []);

  useEffect(() => {
    if (isDemoMode()) {
      setStreamStatus("offline");
      return;
    }

    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (document.visibilityState === "hidden") return;
      es?.close();
      setStreamStatus("connecting");
      es = new EventSource("/api/workspace/stream");

      es.addEventListener("activity", (event) => {
        try {
          const data = JSON.parse((event as MessageEvent).data) as WorkspaceActivitySnapshot;
          applySnapshot(data);
          setStreamStatus("live");
        } catch {
          /* ignore malformed */
        }
      });

      es.addEventListener("heartbeat", () => {
        setStreamStatus("live");
      });

      es.onopen = () => {
        setStreamStatus("live");
      };

      es.onerror = () => {
        setStreamStatus("offline");
        es?.close();
        es = null;
        reconnectTimer = setTimeout(connect, 15_000);
      };
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        connect();
      } else {
        es?.close();
        es = null;
        if (reconnectTimer) clearTimeout(reconnectTimer);
      }
    };

    connect();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      es?.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [applySnapshot]);

  const value = useMemo<WorkspaceActivityContextValue>(
    () => ({ ...snapshot, streamStatus }),
    [snapshot, streamStatus]
  );

  return (
    <WorkspaceActivityContext.Provider value={value}>{children}</WorkspaceActivityContext.Provider>
  );
}

export function useWorkspaceActivityOptional(): WorkspaceActivityContextValue | null {
  return useContext(WorkspaceActivityContext);
}

export function useWorkspaceActivityStreamLive(): boolean {
  const ctx = useWorkspaceActivityOptional();
  return ctx?.streamStatus === "live";
}
