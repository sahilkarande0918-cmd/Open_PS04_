"use client";

import { useState } from "react";

type Word = { t: string; fix?: string; why?: string };

// A real-shaped transcript segment: what Whisper hears in a Hinglish class, and the corrections.
const SEGMENT: Word[] = [
  { t: "toh" }, { t: "ab" }, { t: "hum" },
  { t: "use effect", fix: "useEffect", why: "React glossary · seen on screen at 12:39" },
  { t: "ke" }, { t: "andar" },
  { t: "set data", fix: "setData", why: "code token on screen, line 4" },
  { t: "call" }, { t: "karenge," }, { t: "aur" },
  { t: "at the rate autowired", fix: "@Autowired", why: "Spring glossary" },
  { t: "wala" }, { t: "example" }, { t: "baad" }, { t: "mein." },
];

function Row({ mode, onAccept }: { mode: "heard" | "checked" | "fixed"; onAccept?: () => void }) {
  return (
    <div data-ui className="w-full max-w-[640px] rounded-[6px] bg-surface p-4 text-[15px] leading-7">
      <div className="mb-2 flex items-center gap-3 text-[13px] text-muted">
        <span className="tabular-nums">12:41.3 – 12:47.9</span>
        <span>Instructor</span>
        <span className="ml-auto">{mode === "fixed" ? "3 terms corrected" : mode === "checked" ? "3 suggestions" : "Raw transcript"}</span>
      </div>
      <p>
        {SEGMENT.map((w, i) => {
          if (!w.fix) return <span key={i}>{w.t} </span>;
          if (mode === "heard")
            return (
              <span key={i} className="underline decoration-dotted decoration-muted underline-offset-4">
                {w.t}{" "}
              </span>
            );
          if (mode === "fixed")
            return (
              <span key={i}>
                <code className="font-mono text-[14px] text-accent">{w.fix}</code>{" "}
              </span>
            );
          return (
            <span key={i} className="rounded-[3px] bg-surface-3 px-1">
              <s className="text-muted">{w.t}</s> <code className="font-mono text-[14px] text-accent">{w.fix}</code>{" "}
            </span>
          );
        })}
      </p>
      {mode === "checked" && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-3 text-[13px] text-muted">
          {SEGMENT.filter((w) => w.fix).map((w) => (
            <span key={w.fix}>
              <code className="font-mono text-ink">{w.fix}</code> — {w.why}
            </span>
          ))}
          <button
            type="button"
            onClick={onAccept}
            className="ml-auto rounded-[4px] bg-accent px-3 py-1.5 text-[13px] font-semibold text-accent-ink transition-transform active:scale-[0.97] hover:brightness-110"
          >
            Accept all
          </button>
        </div>
      )}
    </div>
  );
}

export function TranscriptStates() {
  const [accepted, setAccepted] = useState(false);
  const states = [
    { word: "Heard", el: <Row mode="heard" /> },
    {
      word: accepted ? "Fixed" : "Checked",
      el: <Row mode={accepted ? "fixed" : "checked"} onAccept={() => setAccepted(true)} />,
    },
    { word: "Fixed", el: <Row mode="fixed" /> },
  ];
  return (
    <div className="flex flex-col gap-14">
      {states.map((s, i) => (
        <div key={i} data-reveal style={{ "--d": i } as React.CSSProperties} className="grid gap-2.5 md:grid-cols-12 md:gap-6">
          <p className="order-2 text-[17px] text-muted md:order-1 md:col-span-3 md:pt-4 md:text-right md:text-[22px]">{s.word}</p>
          <div className="order-1 md:order-2 md:col-span-6">{s.el}</div>
        </div>
      ))}
    </div>
  );
}
