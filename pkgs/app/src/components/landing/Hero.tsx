import Link from "next/link";

const STEPS = [
  { n: "1", label: "Witness", detail: "Secret key and vote choice stay on your device." },
  { n: "2", label: "Circuit", detail: "Commitment and nullifier are computed locally." },
  { n: "3", label: "Ledger", detail: "Only the proof and the tally become public." },
];

export function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-6 pt-20 pb-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
      <div>
        <span className="pill border-border text-ink-dim inline-block mb-5">
          Built for Midnight Network
        </span>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-[1.1] mb-5">
          Vote privately.
          <br />
          <span className="text-cyan-bright">Verify publicly.</span>
        </h1>
        <p className="text-ink-dim text-base leading-relaxed mb-8 max-w-md">
          ZK-Ballot proves you are eligible to vote and have not voted twice,
          without revealing who you are or what you chose. Built on
          Midnight&#39;s Compact language.
        </p>
        <div className="flex items-center gap-3">
          <Link href="/app" className="btn-primary px-5 py-2.5 text-sm">
            Enter App
          </Link>
          <a href="#how-it-works" className="btn-secondary px-5 py-2.5 text-sm">
            How it works
          </a>
        </div>
      </div>

      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-5">
          <span className="pill bg-emerald/10 border-emerald/30 text-emerald">
            Real hashing, local ledger
          </span>
          <span className="text-xs text-ink-faint font-mono">Wave 1</span>
        </div>
        <div className="space-y-4">
          {STEPS.map((s) => (
            <div key={s.n} className="flex gap-3">
              <span className="w-6 h-6 rounded-full border border-cyan-dim text-cyan-bright text-xs flex items-center justify-center shrink-0 font-mono">
                {s.n}
              </span>
              <div>
                <p className="text-sm font-medium text-ink">{s.label}</p>
                <p className="text-xs text-ink-dim">{s.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
