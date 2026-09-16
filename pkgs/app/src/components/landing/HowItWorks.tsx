const CARDS = [
  {
    n: "1",
    title: "Witness context",
    body: "Your secret key, vote choice, and requirement confirmations stay on your device. Nothing raw ever leaves your browser.",
  },
  {
    n: "2",
    title: "Compact circuit",
    body: "A local hashing routine computes your commitment and a single-use nullifier, and checks eligibility, without exposing your identity.",
  },
  {
    n: "3",
    title: "Ledger",
    body: "Only the nullifier and the updated tally become public. There is no link between a voter and a specific vote.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-16 scroll-mt-20">
      <h2 className="text-2xl font-semibold tracking-tight mb-2">
        How it works
      </h2>
      <p className="text-ink-dim text-sm mb-10 max-w-2xl">
        Midnight separates voting into three isolation layers, so voter
        identity stays private while the tally stays verifiable.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {CARDS.map((c) => (
          <div key={c.n} className="glass-panel p-5">
            <span className="w-7 h-7 rounded-full border border-cyan-dim text-cyan-bright text-xs flex items-center justify-center font-mono mb-4">
              {c.n}
            </span>
            <h3 className="text-sm font-semibold text-ink mb-1.5">
              {c.title}
            </h3>
            <p className="text-xs text-ink-dim leading-relaxed">{c.body}</p>
          </div>
        ))}
      </div>

      <div className="glass-panel p-6">
        <h3 className="text-sm font-semibold text-ink mb-4">
          Data flow and privacy boundary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] gap-3 items-stretch">
          <div className="border border-cyan-dim/40 rounded-md p-4">
            <p className="text-[11px] uppercase tracking-wide text-cyan-bright mb-2">
              Client side, private
            </p>
            <ul className="text-xs text-ink-dim space-y-1">
              <li>Voter secret key</li>
              <li>Vote choice</li>
              <li>Requirement confirmations</li>
            </ul>
          </div>
          <div className="hidden md:flex items-center justify-center text-ink-faint text-xs">
            &#8594;
          </div>
          <div className="border border-border rounded-md p-4">
            <p className="text-[11px] uppercase tracking-wide text-ink-dim mb-2">
              Local circuit
            </p>
            <ul className="text-xs text-ink-dim space-y-1">
              <li>Commitment hash</li>
              <li>Nullifier hash</li>
              <li>Eligibility check</li>
            </ul>
          </div>
          <div className="hidden md:flex items-center justify-center text-ink-faint text-xs">
            &#8594;
          </div>
          <div className="border border-emerald/40 rounded-md p-4">
            <p className="text-[11px] uppercase tracking-wide text-emerald mb-2">
              Ledger, public
            </p>
            <ul className="text-xs text-ink-dim space-y-1">
              <li>Nullifier registry</li>
              <li>Disclosed tally</li>
            </ul>
          </div>
        </div>
        <p className="text-[11px] text-ink-faint mt-4">
          Wave 1: this flow runs locally in your browser using real
          commitment and nullifier hashing. Live deployment to Midnight
          testnet is planned for Wave 2.
        </p>
      </div>
    </section>
  );
}
