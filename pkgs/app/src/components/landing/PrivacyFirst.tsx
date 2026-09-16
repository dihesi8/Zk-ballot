const EXPOSED = [
  "Wallet address fully exposed",
  "Token holdings fully exposed",
  "Individual vote choice fully exposed",
  "Historical voting profile fully exposed",
];

const PROTECTED = [
  "Eligibility proof, verified via circuit",
  "Double vote guard, nullifier registered",
  "Aggregate vote counter, disclosed",
  "Voter identity, fully shielded",
];

export function PrivacyFirst() {
  return (
    <section id="privacy-first" className="mx-auto max-w-6xl px-6 py-16 scroll-mt-20">
      <h2 className="text-2xl font-semibold tracking-tight mb-2">
        Privacy first
      </h2>
      <p className="text-ink-dim text-sm mb-10 max-w-2xl">
        Traditional public voting exposes a complete wallet history.
        ZK-Ballot decouples identity from the decision itself.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-panel p-5">
          <p className="text-xs uppercase tracking-wide text-rose mb-4">
            Traditional public DAO
          </p>
          <ul className="space-y-3">
            {EXPOSED.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-ink-dim">
                <span className="text-rose text-xs mt-0.5">&#10005;</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-panel p-5 border-emerald/20">
          <p className="text-xs uppercase tracking-wide text-emerald mb-4">
            ZK-Ballot
          </p>
          <ul className="space-y-3">
            {PROTECTED.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-ink-dim">
                <span className="text-emerald text-xs mt-0.5">&#10003;</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
