"use client";

import { useEffect, useState } from "react";
import {
  getUsEquitySessionInfo,
  type UsEquitySessionInfo,
} from "@/lib/market/us-equity-session";

const TICK_MS = 60_000;

export function useEquityMarketSession(): UsEquitySessionInfo {
  const [info, setInfo] = useState<UsEquitySessionInfo>(() => getUsEquitySessionInfo());

  useEffect(() => {
    const update = () => setInfo(getUsEquitySessionInfo());
    update();
    const id = window.setInterval(update, TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  return info;
}
