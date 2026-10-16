"use client";

import { useEffect, useRef, useState } from "react";
import { USE_FETCH, highlight } from "./code";

// The fragment works in the source recording's own pixels: a 1920×1080 screen share.
const SRC_W = 1920;
const SRC_H = 1080;
const CROP_W = Math.round((SRC_H * 9) / 16); // 608
const EDITOR = { x0: 260, x1: 1300, top: 96, lineH: 46 };
const REGIONS = [
  { name: "file tree", x0: 0, x1: EDITOR.x0 },
  { name: "editor", x0: EDITOR.x0, x1: EDITOR.x1 },
  { name: "terminal", x0: EDITOR.x1, x1: SRC_W },
];
// Where the instructor's cursor goes when nobody is pointing (autopilot).
const AUTOPILOT = [
  { x: 640, y: EDITOR.top + 6 * EDITOR.lineH },
  { x: 980, y: EDITOR.top + 8 * EDITOR.lineH },
  { x: 1610, y: 420 },
  { x: 760, y: EDITOR.top + 12 * EDITOR.lineH },
];
const CAPTION = ["ab", "dekho,", "yeh", "useEffect", "har", "render", "ke", "baad", "chalta", "hai"];
const TECH = new Set(["useEffect"]);

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

// The screen share is laid out in quarter-pixels of the 1920×1080 source (Q = 0.25) and scaled up,
// so the same element renders both the source frame and the 9:16 preview.
const Q = 0.25;
const q = (v: number) => v * Q;

function ScreenShare({ activeLine }: { activeLine: number | null }) {
  return (
    <pre
      className="absolute left-0 top-0 m-0 whitespace-normal bg-[#1e1e1e] font-mono text-[#d4d4d4]"
      style={{ width: q(SRC_W), height: q(SRC_H) }}
    >
      <div className="flex items-end bg-[#252526]" style={{ height: q(56), paddingLeft: q(260), fontSize: q(24) }}>
        <div className="bg-[#1e1e1e]" style={{ padding: `${q(8)}px ${q(24)}px` }}>useFetch.js</div>
        <div className="text-[#9d9d9d]" style={{ padding: `${q(8)}px ${q(24)}px` }}>App.jsx</div>
      </div>
      <div
        className="absolute left-0 h-full bg-[#252526] text-[#bdbdbd]"
        style={{ top: q(56), width: q(260), padding: `${q(24)}px ${q(24)}px`, fontSize: q(22), lineHeight: `${q(44)}px` }}
      >
        <div>src</div>
        <div style={{ paddingLeft: q(20) }}>hooks</div>
        <div className="bg-[#37373d] text-white" style={{ paddingLeft: q(40) }}>useFetch.js</div>
        <div style={{ paddingLeft: q(20) }}>App.jsx</div>
        <div style={{ paddingLeft: q(20) }}>main.jsx</div>
        <div>package.json</div>
      </div>
      <div className="absolute" style={{ left: q(EDITOR.x0), top: q(EDITOR.top), width: q(EDITOR.x1 - EDITOR.x0), fontSize: q(27) }}>
        {USE_FETCH.map((l, i) => (
          <div
            key={i}
            className="flex whitespace-pre"
            style={{ height: q(EDITOR.lineH), lineHeight: `${q(EDITOR.lineH)}px`, background: i === activeLine ? "#2a2d2e" : undefined }}
          >
            <span className="shrink-0 text-right text-[#6e7681]" style={{ width: q(72), paddingRight: q(20) }}>
              {i + 1}
            </span>
            <span>{highlight(l)}</span>
          </div>
        ))}
      </div>
      <div
        className="absolute h-full bg-[#181818]"
        style={{ left: q(EDITOR.x1), top: q(56), width: q(SRC_W - EDITOR.x1), padding: `${q(32)}px ${q(32)}px`, fontSize: q(23), lineHeight: `${q(42)}px` }}
      >
        <div className="text-[#9d9d9d]">TERMINAL</div>
        <div>$ npm run dev</div>
        <div className="text-[#5fc48a]">VITE ready in 312 ms</div>
        <div>Local: http://localhost:5173/</div>
        <div style={{ paddingTop: q(24) }}>GET /api/users 200 41ms</div>
        <div>GET /api/users 200 38ms</div>
        <div className="text-[#f06a5c]">AbortError: aborted</div>
      </div>
    </pre>
  );
}

export function CropDemo() {
  const frameRef = useRef<HTMLDivElement>(null);
  const [frameW, setFrameW] = useState(440);
  const target = useRef({ x: AUTOPILOT[0].x, y: AUTOPILOT[0].y });
  const lastPointer = useRef(0);
  const [cropX, setCropX] = useState(AUTOPILOT[0].x - CROP_W / 2);
  const [focus, setFocus] = useState(AUTOPILOT[0]);
  const [word, setWord] = useState(0);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setFrameW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Temporal smoothing: the crop eases toward the active point instead of jumping.
  useEffect(() => {
    let raf = 0;
    let step = 0;
    let lastStep = performance.now();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tick = (now: number) => {
      if (now - lastPointer.current > 2500 && now - lastStep > 1800) {
        step = (step + 1) % AUTOPILOT.length;
        target.current = { ...AUTOPILOT[step] };
        lastStep = now;
      }
      const t = target.current;
      const goal = clamp(t.x - CROP_W / 2, 0, SRC_W - CROP_W);
      setCropX((cx) => (reduce ? goal : cx + (goal - cx) * 0.12));
      setFocus(t);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setWord((w) => (w + 1) % (CAPTION.length + 3)), 380);
    return () => clearInterval(id);
  }, []);

  const scale = frameW / SRC_W;
  const frameH = frameW * (SRC_H / SRC_W);
  const region = REGIONS.find((r) => focus.x >= r.x0 && focus.x < r.x1) ?? REGIONS[1];
  const line =
    region.name === "editor" ? clamp(Math.floor((focus.y - EDITOR.top) / EDITOR.lineH), 0, USE_FETCH.length - 1) : null;

  function onPointer(e: React.PointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    target.current = { x: ((e.clientX - r.left) / r.width) * SRC_W, y: ((e.clientY - r.top) / r.height) * SRC_H };
    lastPointer.current = performance.now();
  }

  // The 9:16 output is the large element: it is what proves the code stays readable.
  const prevH = Math.max(frameH * 2.5, 260);
  const outScale = prevH / SRC_H;

  return (
    <div data-ui className="flex w-full max-w-[660px] select-none items-start gap-4">
      <div className="min-w-0 flex-1">
        <div
          ref={frameRef}
          onPointerMove={onPointer}
          onPointerDown={onPointer}
          className="relative cursor-crosshair overflow-hidden rounded-[4px]"
          style={{ height: frameH, touchAction: "pan-y" }}
          aria-label="Screen-share recording. Move the pointer over it; the 9:16 crop follows the active region."
          role="img"
        >
          <div style={{ transform: `scale(${scale / Q})`, transformOrigin: "0 0" }}>
            <ScreenShare activeLine={line} />
          </div>
          <div
            className="pointer-events-none absolute inset-y-0 border-2 border-accent shadow-[0_0_0_2000px_rgba(0,0,0,0.65)]"
            style={{ left: cropX * scale, width: CROP_W * scale }}
          />
        </div>
        <p className="mt-2 text-[13px] text-muted">Source, 1920×1080. Point at it.</p>
        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[13px] text-muted">
          <dt>Crop</dt>
          <dd className="tabular-nums text-ink">x {Math.round(cropX)}</dd>
          <dt>Size</dt>
          <dd className="tabular-nums text-ink">
            {CROP_W}×{SRC_H}
          </dd>
          <dt>Following</dt>
          <dd className="text-ink">
            {region.name}
            {line !== null ? `, line ${line + 1}` : ""}
          </dd>
        </dl>
      </div>
      <div className="pointer-events-none relative shrink-0 overflow-hidden rounded-[6px] bg-black" style={{ height: prevH, width: (prevH * 9) / 16 }}>
        <div style={{ transform: `translateX(${-cropX * outScale}px) scale(${outScale / Q})`, transformOrigin: "0 0" }}>
          <ScreenShare activeLine={line} />
        </div>
        <div className="absolute left-2 top-2 rounded-[3px] bg-accent px-1.5 py-0.5 font-semibold text-accent-ink" style={{ fontSize: prevH * 0.026 }}>
          @nimbu.academy
        </div>
        <p
          className="absolute inset-x-2 bottom-[14%] rounded-[3px] bg-black/80 px-1.5 py-1 text-center font-semibold leading-tight text-white"
          style={{ fontSize: prevH * 0.036 }}
        >
          {CAPTION.map((w, i) => (
            <span key={i} style={{ color: i === word ? "var(--accent)" : undefined }}>
              {TECH.has(w) ? <code className="font-mono">{w}</code> : w}{" "}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}
