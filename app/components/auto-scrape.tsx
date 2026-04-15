"use client";

import { useEffect } from "react";

export default function AutoScrape() {
  useEffect(() => {
    fetch("/api/scrape").catch(() => {});
  }, []);
  return null;
}
