"use client";

const VOTER_LABELS = ["Voter 1", "Voter 2", "Voter 3"];

export function Header({
  role,
  onRoleChange,
}: {
  role: "admin" | 0 | 1 | 2;
  onRoleChange: (role: "admin" | 0 | 1 | 2) => void;
}) {
  return (
    <header className="border-b border-border/60 sticky top-0 z-10 bg-void/80 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-cyan-bright shadow-[0_0_8px_rgba(79,195,208,0.6)]" />
          <span className="font-semibold tracking-tight">
            ZK<span className="text-cyan-bright">-Ballot</span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-ink-faint text-xs">Mode</span>
          <div className="flex rounded-full border border-border overflow-hidden text-xs">
            <span className="px-3 py-1 bg-emerald/20 text-emerald font-medium">
              Simulated
            </span>
            <span
              className="px-3 py-1 text-ink-faint/60 cursor-not-allowed"
              title="Live testnet wiring is planned for Wave 2, see CHANGELOG.md"
            >
              Live
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 pb-3 flex items-center gap-1 text-sm">
        <span className="text-ink-faint text-xs mr-2">Acting as</span>
        <button
          onClick={() => onRoleChange("admin")}
          className={`px-3 py-1.5 rounded-md transition-colors ${
            role === "admin"
              ? "bg-cyan/10 text-cyan-bright border border-cyan/30"
              : "text-ink-faint hover:text-ink-dim border border-transparent"
          }`}
        >
          Admin
        </button>
        {VOTER_LABELS.map((label, i) => (
          <button
            key={label}
            onClick={() => onRoleChange(i as 0 | 1 | 2)}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              role === i
                ? "bg-cyan/10 text-cyan-bright border border-cyan/30"
                : "text-ink-faint hover:text-ink-dim border border-transparent"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </header>
  );
}
