import type { ReactNode } from "react";

function Module({ title, body, children }: { title: string; body: [string, string]; children: ReactNode }) {
  return (
    <div className="flex max-w-[680px] flex-col gap-4 sm:flex-row sm:gap-5">
      <div data-reveal className="w-full shrink-0 overflow-hidden rounded-[6px] bg-surface sm:w-[380px]">{children}</div>
      <div data-reveal style={{ "--d": 1 } as React.CSSProperties} className="sm:w-[280px]">
        <h3 className="text-[17px] font-semibold leading-snug">{title}</h3>
        <p className="mt-2 text-[17px] leading-relaxed text-muted">{body[0]}</p>
        <p className="mt-2 text-[17px] leading-relaxed text-muted">{body[1]}</p>
      </div>
    </div>
  );
}

function BoundaryFragment() {
  const sentences = [18, 26, 14, 30, 22, 16, 24];
  let x = 0;
  return (
    <div data-ui className="p-4 text-[13px]">
      <div className="relative h-10 overflow-hidden rounded-[3px] bg-surface-2">
        {sentences.map((w, i) => {
          const left = x;
          x += w + 2;
          return <div key={i} className="absolute inset-y-2 rounded-[2px] bg-surface-3" style={{ left: `${left}%`, width: `${w * 0.55}%` }} />;
        })}
        <div className="absolute inset-y-0 border-x-2 border-accent bg-accent/15" style={{ left: "20%", width: "41%" }} />
      </div>
      <div className="mt-3 flex justify-between tabular-nums text-muted">
        <span>
          <span className="text-ink">14:02.1</span> sentence start
        </span>
        <span>
          <span className="text-ink">14:49.8</span> pause 0.9 s
        </span>
      </div>
      <p className="mt-2 text-muted">
        47.7 s · heuristic score <span className="text-ink">0.81</span> · ends on the conclusion
      </p>
    </div>
  );
}

function BrandFragment() {
  return (
    <div data-ui className="flex items-center gap-4 p-4 text-[13px]">
      <div className="flex h-[132px] w-[74px] shrink-0 flex-col justify-between rounded-[4px] bg-[#0f2a24] p-2">
        <span className="rounded-[2px] bg-[#e9c46a] px-1 text-[8px] font-semibold text-[#0f2a24]">Nimbu Academy</span>
        <span className="text-center text-[8px] font-semibold leading-tight text-white">
          props vs <span className="text-[#e9c46a]">state</span>
        </span>
      </div>
      <dl className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5 text-muted">
        <dt>Primary</dt>
        <dd className="flex items-center gap-2 text-ink">
          <i className="h-3 w-3 rounded-[2px] bg-[#0f2a24]" /> #0F2A24
        </dd>
        <dt>Accent</dt>
        <dd className="flex items-center gap-2 text-ink">
          <i className="h-3 w-3 rounded-[2px] bg-[#e9c46a]" /> #E9C46A
        </dd>
        <dt>Font</dt>
        <dd className="text-ink">Poppins 600</dd>
        <dt>Intro</dt>
        <dd className="text-ink">Logo sting, 1.5 s</dd>
      </dl>
    </div>
  );
}

function TopicFragment() {
  const scenes = [
    ["0–8 s", "The problem: two ways to send data"],
    ["8–20 s", "JSON: keys, arrays, types"],
    ["20–33 s", "XML: tags, attributes, schema"],
    ["33–45 s", "When to use which"],
  ];
  return (
    <div data-ui className="p-4 text-[13px]">
      <div className="rounded-[4px] border border-line bg-surface-2 px-3 py-2 text-[14px] text-ink">JSON vs XML</div>
      <ol className="mt-3 space-y-1.5">
        {scenes.map(([t, s]) => (
          <li key={t} className="flex gap-3">
            <span className="w-14 shrink-0 tabular-nums text-muted">{t}</span>
            <span className="text-ink">{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ScheduleFragment() {
  const rows = [
    ["Instagram Reel", "Fri 18:30 IST", "Scheduled"],
    ["YouTube Short", "Sat 10:00 IST", "Scheduled"],
    ["Instagram Reel", "Tue 19:00 IST", "Published"],
  ];
  return (
    <table data-ui className="w-full text-left text-[13px]">
      <tbody>
        {rows.map(([p, t, s], i) => (
          <tr key={i} className="border-b border-line last:border-0">
            <td className="px-4 py-2.5 text-ink">{p}</td>
            <td className="py-2.5 tabular-nums text-muted">{t}</td>
            <td className={`px-4 py-2.5 text-right ${s === "Published" ? "text-success" : "text-accent"}`}>{s}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function LocalFragment() {
  return (
    <div data-ui className="space-y-1.5 p-4 text-[13px] text-muted">
      <div className="flex justify-between">
        <span>Transcribe · faster-whisper</span>
        <span className="text-ink">local GPU</span>
      </div>
      <div className="flex justify-between">
        <span>Highlights · local LLM</span>
        <span className="text-ink">local GPU</span>
      </div>
      <div className="flex justify-between">
        <span>Render · Hyperframes</span>
        <span className="text-ink">local</span>
      </div>
      <div className="flex justify-between">
        <span>Raw recording</span>
        <span className="text-ink">stays on your disk</span>
      </div>
    </div>
  );
}

export function Features() {
  return (
    <div className="flex flex-col gap-24">
      <Module
        title="Clips end where the thought ends."
        body={[
          "Candidates are cut on sentence boundaries and pauses, never mid-example. Each one comes with the reason it was picked.",
          "Scores combine meaning, voice energy and what changed on screen, and they are labelled as heuristics, not certainty.",
        ]}
      >
        <BoundaryFragment />
      </Module>
      <Module
        title="Your institute's brand on every frame."
        body={[
          "Colours, fonts, logo, intro and outro are applied to every reel automatically.",
          "Each project keeps a snapshot of the kit, so an old reel re-renders exactly as it was.",
        ]}
      >
        <BrandFragment />
      </Module>
      <Module
        title="Type a topic, get forty-five seconds."
        body={[
          "A script, code that types and changes on screen, a local voiceover and synced captions.",
          "Code examples are parsed before they are shown, so the JSON on screen is valid JSON.",
        ]}
      >
        <TopicFragment />
      </Module>
      <Module
        title="Schedule Instagram and YouTube from one calendar."
        body={[
          "Publishing uses the official APIs. A post is marked published only when the platform confirms it.",
          "Performance comes back in and nudges which moments get suggested next time.",
        ]}
      >
        <ScheduleFragment />
      </Module>
      <Module
        title="The heavy work runs on your own machine."
        body={[
          "Recordings are processed by open models on a local GPU. No paid AI APIs are involved.",
          "Only metadata and the reels you choose to publish are stored in the cloud.",
        ]}
      >
        <LocalFragment />
      </Module>
    </div>
  );
}
