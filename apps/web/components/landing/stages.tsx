"use client";

import { useState, type ReactNode } from "react";

const STAGES: { name: string; clause: [string, string]; ui: ReactNode }[] = [
  {
    name: "Upload",
    clause: ["First, drop in", "a class recording."],
    ui: (
      <div className="space-y-3 text-[13px]">
        <div className="flex justify-between text-ink">
          <span>react-hooks-class-07.mp4</span>
          <span className="tabular-nums">1.4 GB</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-3">
          <div className="h-full w-[64%] bg-accent" />
        </div>
        <div className="flex justify-between tabular-nums text-muted">
          <span>1 h 32 min · 1920×1080 · 30 fps</span>
          <span>64%</span>
        </div>
      </div>
    ),
  },
  {
    name: "Find",
    clause: ["Then it finds", "the teaching moments."],
    ui: (
      <ol className="space-y-2 text-[13px]">
        {[
          ["Why useEffect runs twice", "14:02–14:49", "0.81"],
          ["Cleanup with AbortController", "31:10–31:56", "0.77"],
          ["Dependency array mistakes", "52:40–53:33", "0.72"],
        ].map(([t, r, s]) => (
          <li key={t} className="flex gap-3 rounded-[4px] bg-surface-2 px-3 py-2">
            <span className="flex-1 text-ink">{t}</span>
            <span className="tabular-nums text-muted">{r}</span>
            <span className="tabular-nums text-accent">{s}</span>
          </li>
        ))}
      </ol>
    ),
  },
  {
    name: "Frame",
    clause: ["It frames", "the code, not the centre."],
    ui: (
      <table className="w-full text-left text-[13px] tabular-nums">
        <thead className="text-muted">
          <tr>
            <th className="pb-2 font-normal">Time</th>
            <th className="pb-2 font-normal">Region</th>
            <th className="pb-2 text-right font-normal">crop x</th>
          </tr>
        </thead>
        <tbody className="text-ink">
          {[
            ["14:02.1", "editor, line 7", "412"],
            ["14:15.8", "editor, line 12", "520"],
            ["14:31.0", "terminal", "1312"],
            ["14:44.2", "editor, line 13", "498"],
          ].map((r) => (
            <tr key={r[0]} className="border-t border-line">
              <td className="py-1.5">{r[0]}</td>
              <td>{r[1]}</td>
              <td className="text-right">{r[2]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
  },
  {
    name: "Publish",
    clause: ["You review,", "render and publish."],
    ui: (
      <div className="space-y-2 text-[13px]">
        <div className="flex justify-between text-ink">
          <span>Render · delivery quality</span>
          <span className="text-success">Done · 0:47</span>
        </div>
        <div className="flex justify-between text-muted">
          <span>Instagram Reel</span>
          <span className="text-accent">Fri 18:30 IST</span>
        </div>
        <div className="flex justify-between text-muted">
          <span>YouTube Short</span>
          <span className="text-accent">Sat 10:00 IST</span>
        </div>
      </div>
    ),
  },
];

export function Stages() {
  const [i, setI] = useState(0);
  const s = STAGES[i];
  return (
    <section aria-label="How it works" className="grid min-h-[88svh] md:grid-cols-2">
      <div className="order-2 flex flex-col justify-between bg-bg px-5 py-12 md:order-1 md:px-10 md:py-16">
        <h2 key={s.name} className="text-[9vw] leading-[1.02] tracking-[-0.02em] md:text-[30px] lg:text-[44px] xl:text-[64px]" aria-live="polite">
          {s.clause[0]}
          <br />
          {s.clause[1]}
        </h2>
      </div>
      <div className="order-1 flex items-center justify-center bg-surface px-5 py-12 md:order-2">
        <div data-ui key={s.name} className="w-full max-w-[440px] rounded-[6px] bg-bg p-5 animate-[fade-up_200ms_ease-out]">
          {s.ui}
        </div>
      </div>
      <div className="order-3 px-5 pb-10 md:col-span-2 md:px-10">
        <label htmlFor="stage" className="sr-only">
          Stage
        </label>
        <input
          id="stage"
          type="range"
          min={0}
          max={3}
          step={1}
          value={i}
          onChange={(e) => setI(Number(e.target.value))}
          className="stage-range w-full"
          style={{ "--p": `${(i / 3) * 100}%` } as React.CSSProperties}
        />
        <div className="mt-3 grid grid-cols-2 gap-2 text-[17px] md:grid-cols-4 md:text-[17px]">
          {STAGES.map((st, k) => (
            <button
              key={st.name}
              type="button"
              onClick={() => setI(k)}
              className={`text-left transition-colors hover:text-ink ${k === i ? "text-ink" : "text-muted"}`}
            >
              {st.name}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
