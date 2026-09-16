import Link from "next/link";

export function LandingHeader() {
  return (
    <header className="border-b border-border/60 sticky top-0 z-10 bg-void/80 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-cyan-bright shadow-[0_0_8px_rgba(79,195,208,0.5)]" />
          <span className="font-semibold tracking-tight">
            ZK<span className="text-cyan-bright">-Ballot</span>
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm text-ink-dim">
          <a href="#how-it-works" className="hover:text-ink transition-colors">
            How it works
          </a>
          <a href="#tech-stack" className="hover:text-ink transition-colors">
            Tech stack
          </a>
          <a href="#privacy-first" className="hover:text-ink transition-colors">
            Privacy first
          </a>
          <a href="#" className="hover:text-ink transition-colors">
            Docs
          </a>
        </nav>

        <Link href="/app" className="btn-primary px-4 py-2 text-sm">
          Enter App
        </Link>
      </div>
    </header>
  );
}
