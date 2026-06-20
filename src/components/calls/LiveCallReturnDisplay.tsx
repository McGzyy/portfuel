"use client";

import { useEffect, useRef } from "react";
import { CallReturnDisplay } from "@/components/calls/CallReturnDisplay";

/** Return display that briefly highlights when live quote sync changes the value. */
export function LiveCallReturnDisplay(
  props: React.ComponentProps<typeof CallReturnDisplay>
) {
  const prev = useRef(props.returnPct);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prev.current === props.returnPct || props.returnPct == null) {
      prev.current = props.returnPct;
      return;
    }
    prev.current = props.returnPct;
    const el = rootRef.current;
    if (!el) return;
    el.classList.remove("pf-live-tick");
    void el.offsetWidth;
    el.classList.add("pf-live-tick");
    const t = setTimeout(() => el.classList.remove("pf-live-tick"), 700);
    return () => clearTimeout(t);
  }, [props.returnPct]);

  return (
    <div ref={rootRef} className="shrink-0">
      <CallReturnDisplay {...props} />
    </div>
  );
}
