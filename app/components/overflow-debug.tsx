"use client";
import { useEffect, useState } from "react";

export default function OverflowDebug() {
  const [info, setInfo] = useState("");

  useEffect(() => {
    function check() {
      const vw = window.innerWidth;
      const sw = document.documentElement.scrollWidth;
      if (sw <= vw) {
        setInfo(`OK: ${vw}px`);
        return;
      }
      // Find widest element
      let widest: Element | null = null;
      let maxW = 0;
      document.querySelectorAll("*").forEach((el) => {
        const r = el.getBoundingClientRect();
        const right = r.right;
        if (right > maxW) { maxW = right; widest = el; }
      });
      const tag = widest ? `${(widest as Element).tagName}.${(widest as Element).className.toString().slice(0, 40)}` : "?";
      setInfo(`OVERFLOW ${sw - vw}px extra | vw=${vw} | ${tag}`);
    }
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (!info) return null;
  return (
    <div style={{
      position: "fixed", bottom: 80, left: 8, right: 8, zIndex: 99999,
      background: info.startsWith("OK") ? "#059669" : "#dc2626",
      color: "#fff", padding: "8px 12px", borderRadius: 8,
      fontSize: 11, wordBreak: "break-all", lineHeight: 1.4,
    }}>
      {info}
    </div>
  );
}
