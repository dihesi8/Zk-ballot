export function Footer() {
  return (
    <footer className="border-t border-border/60 mt-20">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-6 mb-6">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-cyan-bright" />
            <span className="font-semibold tracking-tight">
              ZK<span className="text-cyan-bright">-Ballot</span>
            </span>
          </div>
          <nav className="flex items-center gap-6 text-sm text-ink-dim">
            <a href="#" className="hover:text-ink transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-ink transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-ink transition-colors">
              GitHub
            </a>
            <a href="#" className="hover:text-ink transition-colors">
              Buildathon submission
            </a>
          </nav>
        </div>

        <p className="text-sm text-ink-faint mb-6">
          Private DAO voting, proven not trusted.
        </p>

        <div className="border-t border-border/60 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <p className="text-xs text-ink-faint leading-relaxed">
            <span className="text-ink-dim font-medium">Privacy: </span>
            All voter secret keys, requirement confirmations, and vote
            choices stay in your browser&#39;s memory for this Wave 1 build.
            Nothing is uploaded, stored on a server, or linked to any
            account.
          </p>
          <p className="text-xs text-ink-faint leading-relaxed">
            <span className="text-ink-dim font-medium">Terms: </span>
            This is a Midnight Buildathon prototype for evaluation. It is
            not a production voting or identity service. Live testnet
            deployment is planned for Wave 2.
          </p>
        </div>

        <p className="text-xs text-ink-faint/70 mt-8">
          Midnight Buildathon prototype
        </p>
      </div>
    </footer>
  );
}
