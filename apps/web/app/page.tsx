import Image from "next/image";
import Link from "next/link";
import { CropDemo } from "@/components/landing/crop-demo";
import { Features } from "@/components/landing/features";
import { Reveal } from "@/components/landing/reveal";
import { Stages } from "@/components/landing/stages";
import { TranscriptStates } from "@/components/landing/transcript-states";

export default function Landing() {
  return (
    <main className="flex-1">
      <Reveal />
      {/* Hero: two tones meeting at 50%; the product's own control on the right. */}
      <section className="grid min-h-svh md:grid-cols-2">
        <div className="order-2 flex flex-col bg-bg px-5 py-10 md:order-1 md:px-10">
          <span className="hidden text-[17px] font-semibold md:block">Reel Studio</span>
          <div className="mt-auto max-w-[46ch]">
            <h1 className="lines text-[clamp(30px,6.4vw,40px)] leading-[1.04] tracking-[-0.02em] md:text-[32px]">
              <span className="line">
                <span data-line style={{ "--i": 0 } as React.CSSProperties}>
                  Your classes,
                </span>
              </span>
              <span className="line">
                <span data-line style={{ "--i": 1 } as React.CSSProperties}>
                  cut into reels.
                </span>
              </span>
            </h1>
            <div data-after-lines>
              <p className="mt-5 text-[17px] leading-relaxed text-muted">
                Reel Studio finds the 30 to 60 second moments in a recorded class, keeps the code readable in 9:16, and
                spells <code className="font-mono text-[16px] text-ink">useEffect</code> the way you typed it.
              </p>
              <Link
                href="/signup"
                className="mt-7 inline-block bg-ink px-5 py-3 text-[17px] font-semibold text-bg transition-transform hover:bg-white active:scale-[0.98]"
              >
                Start a free studio
              </Link>
            </div>
          </div>
        </div>
        <div className="relative order-1 flex min-h-[58svh] items-center justify-center bg-surface px-5 py-16 md:order-2 md:px-10">
          <span className="absolute left-5 top-5 text-[17px] font-semibold md:hidden">Reel Studio</span>
          <Link href="/login" className="absolute right-5 top-5 text-[17px] text-ink hover:text-accent md:right-10 md:top-10">
            Sign in
          </Link>
          <CropDemo />
        </div>
      </section>


      {/* The old way: real editing benches, the literal reels. */}
      <section className="grid gap-6 px-5 pt-36 md:grid-cols-12 md:px-10 md:pt-52">
        <div className="md:col-span-5 md:flex md:flex-col">
          <p data-reveal className="max-w-[20ch] text-[22px] leading-[1.3] lg:text-[32px]">
            Cutting one good minute used to take an afternoon at the bench.
          </p>
          <p data-reveal style={{ "--d": 1 } as React.CSSProperties} className="mt-5 max-w-[42ch] text-[17px] leading-relaxed text-muted">
            Most institutes record every class and publish none of it, because nobody has those afternoons. Reel Studio
            does the bench work: it watches the recording, listens to the instructor and proposes the cuts.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-3 md:mt-auto">
            {[
              ["/archive/16-and-35-mm-synchronizer-sybzb-b.jpg", "A 16 and 35 mm film synchronizer"],
              ["/archive/moviola-16mm-sound-editing-board.jpg", "A Moviola 16 mm sound editing board"],
              ["/archive/moviola-2.jpg", "A Moviola film viewer"],
            ].map(([src, alt], i) => (
              <div key={src} data-reveal style={{ "--d": i + 2 } as React.CSSProperties} className="relative aspect-[4/5] overflow-hidden">
                <Image src={src} alt={alt} fill sizes="(min-width: 768px) 14vw, 30vw" className="object-cover" />
              </div>
            ))}
          </div>
        </div>
        <div data-reveal className="relative aspect-[3/4] overflow-hidden md:col-span-6 md:col-start-7">
          <Image
            src="/archive/moviola-35mm.jpg"
            alt="A Moviola 35 mm editing machine with two film reels"
            fill
            sizes="(min-width: 768px) 46vw, 100vw"
            className="object-cover"
          />
        </div>
      </section>

      <section className="px-5 pt-36 md:px-10 md:pt-52">
        <div className="md:grid md:grid-cols-12 md:gap-6">
          <h2 data-reveal className="mb-16 text-[22px] leading-tight md:col-span-6 md:col-start-4 md:text-[32px]">Hinglish, spelled right</h2>
        </div>
        <TranscriptStates />
      </section>

      <section className="px-5 pt-36 md:pl-[22%] md:pr-10 md:pt-52">
        <h2 data-reveal className="mb-16 text-[22px] leading-tight md:text-[32px]">What it does with a class</h2>
        <Features />
      </section>

      <div className="pt-36 md:pt-52">
        <Stages />
      </div>

      <section className="mt-36 bg-surface px-5 py-28 md:mt-52 md:px-10 md:py-40">
        <form action="/signup" method="get" className="max-w-[22em] text-[22px] leading-[1.35] md:text-[32px]">
          <label htmlFor="cta-email">Open a free studio for</label>{" "}
          <input
            id="cta-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@institute.in"
            className="my-1 inline-block h-[1.35em] w-full bg-bg px-[0.3em] align-baseline text-ink placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent md:w-[9em]"
          />{" "}
          <button
            type="submit"
            className="h-[1.35em] bg-accent px-[0.35em] font-semibold text-accent-ink transition-transform hover:brightness-110 active:scale-[0.98]"
          >
            today
          </button>
        </form>
        <p className="mt-5 text-[17px] text-muted">You will set a password next. The free plan needs no card.</p>
      </section>

      <footer className="mt-[18svh] grid gap-2 px-5 pb-7 text-[14px] text-muted md:grid-cols-[1fr_auto_1fr] md:items-baseline md:px-10">
        <span>AI video studio for technical educators</span>
        <nav className="flex flex-wrap gap-6 text-ink">
          <a href="https://github.com/sahilkarande0918-cmd/Reel-Studio" className="hover:text-accent">
            Source on GitHub
          </a>
          <Link href="/login" className="hover:text-accent">
            Sign in
          </Link>
        </nav>
        <span className="md:text-right">2026 · Open source, MIT</span>
        <p className="text-[14px] md:col-span-3">
          Pictures:{" "}
          <a className="underline" href="https://commons.wikimedia.org/w/index.php?curid=113118159">Moviola 35mm</a> by Èric Gonzalez Torres,{" "}
          <a className="underline" href="https://commons.wikimedia.org/w/index.php?curid=125312351">16 and 35 mm synchronizer</a>,{" "}
          <a className="underline" href="https://commons.wikimedia.org/w/index.php?curid=57471442">Moviola 16mm Sound Editing Board</a> by Tangerineduel (all CC BY-SA 4.0);{" "}
          <a className="underline" href="https://commons.wikimedia.org/w/index.php?curid=45302939">Moviola 2</a> by Assianir (CC BY-SA 3.0); via Wikimedia Commons.
        </p>
      </footer>
    </main>
  );
}
