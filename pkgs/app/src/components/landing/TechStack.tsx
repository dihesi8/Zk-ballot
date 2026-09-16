const ROWS = [
  {
    layer: "Smart contract",
    tech: "Compact language, compactc 0.30.0",
    status: "Built",
    detail: "Eligibility check, nullifier, and tally circuits. Compiled and verified.",
  },
  {
    layer: "Cryptography",
    tech: "@midnight-ntwrk/compact-runtime",
    status: "Built",
    detail: "Real persistentHash commitment and nullifier hashing, run client side.",
  },
  {
    layer: "Frontend",
    tech: "Next.js 15 and Tailwind CSS",
    status: "Built",
    detail: "Interactive dashboard with a live, locally simulated tally.",
  },
  {
    layer: "Wallet integration",
    tech: "Lace Wallet",
    status: "Planned",
    detail: "Browser extension for signing real transactions.",
  },
  {
    layer: "Deployment",
    tech: "Midnight testnet and a Docker proof server",
    status: "Planned",
    detail: "Live deployment and zero-knowledge proof generation.",
  },
];

export function TechStack() {
  return (
    <section id="tech-stack" className="mx-auto max-w-6xl px-6 py-16 scroll-mt-20">
      <h2 className="text-2xl font-semibold tracking-tight mb-2">
        Tech stack
      </h2>
      <p className="text-ink-dim text-sm mb-8 max-w-2xl">
        What is actually built for Wave 1, and what is planned for Wave 2.
      </p>

      <div className="glass-panel overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left text-ink-faint text-xs uppercase tracking-wide">
              <th className="px-5 py-3 font-medium">Layer</th>
              <th className="px-5 py-3 font-medium">Technology</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium hidden md:table-cell">
                Detail
              </th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.layer} className="border-b border-border/40 last:border-0">
                <td className="px-5 py-3.5 text-ink font-medium">{r.layer}</td>
                <td className="px-5 py-3.5 text-ink-dim font-mono text-xs">
                  {r.tech}
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={`pill ${
                      r.status === "Built"
                        ? "bg-emerald/10 border-emerald/30 text-emerald"
                        : "border-border text-ink-faint"
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-ink-dim text-xs hidden md:table-cell">
                  {r.detail}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
