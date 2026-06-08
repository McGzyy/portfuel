"use client";

import { useEffect, useState } from "react";
import { greetingForHour } from "@/lib/time/greeting";

export function LocalTimeGreeting({
  displayName,
  className,
}: {
  displayName: string;
  className?: string;
}) {
  const [greeting, setGreeting] = useState("Hello");

  useEffect(() => {
    setGreeting(greetingForHour(new Date().getHours()));
  }, []);

  return (
    <h1 className={className}>
      {greeting}, {displayName}
    </h1>
  );
}
