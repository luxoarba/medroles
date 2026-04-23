"use client";
import { useEffect, useState } from "react";

export default function OverflowDebug() {
  const [info, setInfo] = useState("");

  useEffect(() => {
    function check() {
      const vw = window.innerWidth;
      // Always scan bounding rects — scrollWidth is unreliable when
      // overflow-x:hidden clamps it to viewport width regardless of content.
      let widest: Element | null = null;
      let maxRight = 0;
      document.querySelectorAll("*").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.right > maxRight) { maxRight = r.right; widest = el; }
      });
      const extra = maxRight - vw;
      if (extra > 0 && widest) {
        const r2 = (widest as Element).getBoundingClientRect();
        const par = (widest as Element).parentElement;
        const parR = par?.getBoundingClientRect();
        setInfo(
          `OVER +${extra.toFixed(0)}px | el: left=${r2.left.toFixed(0)} w=${r2.width.toFixed(0)} right=${r2.right.toFixed(0)} | parent w=${parR?.width.toFixed(0)} | vw=${vw} | ${(widest as Element).tagName}.${(widest as Element).className.toString().slice(0, 40)}`
        );
      } else if (extra > -10 && widest) {
        const r2 = (widest as Element).getBoundingClientRect();
        setInfo(`EDGE | el: left=${r2.left.toFixed(0)} w=${r2.width.toFixed(0)} right=${r2.right.toFixed(0)} | vw=${vw}`);
      } else {
        setInfo(`OK max-right=${maxRight.toFixed(1)} vw=${vw}`);
      }
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
