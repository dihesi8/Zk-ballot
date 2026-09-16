"use client";

import {
  ALL_REQUIREMENTS,
  REQUIREMENT_LABELS,
  type RequirementId,
} from "@/lib/simulation";

function shortHex(hex: string): string {
  return `${hex.slice(0, 10)}…${hex.slice(-6)}`;
}

export function RegistryPanel({
  requirements,
  onToggleRequirement,
  pastedCommitment,
  onPastedCommitmentChange,
  onAdd,
  quickAdd,
  eligibleVoters,
}: {
  requirements: RequirementId[];
  onToggleRequirement: (id: RequirementId) => void;
  pastedCommitment: string;
  onPastedCommitmentChange: (v: string) => void;
  onAdd: () => void;
  quickAdd: { label: string; add: () => void }[];
  eligibleVoters: Set<string>;
}) {
  return (
    <div className="space-y-4">
      <div className="glass-panel p-5">
        <h3 className="text-sm font-semibold text-ink mb-1">
          Voting requirements
        </h3>
        <p className="text-xs text-ink-dim mb-3">
          Choose which demo criteria voters must self-confirm before their
          verification hash unlocks.
        </p>
        <div className="flex flex-wrap gap-2">
          {ALL_REQUIREMENTS.map((r) => {
            const active = requirements.includes(r);
            return (
              <button
                key={r}
                onClick={() => onToggleRequirement(r)}
                className={`pill transition-colors ${
                  active
                    ? "bg-cyan/10 border-cyan/40 text-cyan-bright"
                    : "border-border text-ink-faint hover:text-ink-dim"
                }`}
              >
                {REQUIREMENT_LABELS[r]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="glass-panel p-5">
        <h3 className="text-sm font-semibold text-ink mb-1">Registry desk</h3>
        <p className="text-xs text-ink-dim mb-4">
          Add a voter by their verification hash. You never see their secret
          key. Only the hash they share with you.
        </p>
        <input
          value={pastedCommitment}
          onChange={(e) => onPastedCommitmentChange(e.target.value)}
          placeholder="e.g. 4f2a91..."
          className="glass-input w-full font-mono text-xs mb-3"
        />
        <button
          onClick={onAdd}
          disabled={!pastedCommitment}
          className="btn-primary w-full py-2 text-sm"
        >
          Add eligible voter
        </button>
        <div className="mt-4 pt-4 border-t border-border/60">
          <p className="text-[11px] uppercase tracking-wide text-ink-faint mb-2">
            Quick add (demo)
          </p>
          <div className="flex gap-2 flex-wrap">
            {quickAdd.map(({ label, add }) => (
              <button
                key={label}
                onClick={add}
                className="btn-secondary text-xs px-3 py-1.5"
              >
                Add {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-panel p-5">
        <div className="flex items-baseline justify-between mb-1">
          <h3 className="text-sm font-semibold text-ink">
            Eligible voters
          </h3>
          <span className="font-mono text-xs text-ink-dim">
            {eligibleVoters.size}
          </span>
        </div>
        <p className="text-xs text-ink-dim mb-3">
          By design, this list shows{" "}
          <span className="text-ink">who is eligible</span>, not{" "}
          <span className="text-ink">who has voted</span>. Nullifiers are
          intentionally unlinkable to voter identity, so per-proposal vote
          counts (below) can never be traced back to this list. That
          unlinkability is the actual privacy guarantee, not a missing
          feature.
        </p>
        {eligibleVoters.size === 0 ? (
          <p className="text-xs text-ink-faint italic">No voters registered yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {Array.from(eligibleVoters).map((hex) => (
              <li
                key={hex}
                className="font-mono text-xs text-ink-dim bg-surface/60 border border-border/60 rounded px-2.5 py-1.5"
              >
                {shortHex(hex)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
