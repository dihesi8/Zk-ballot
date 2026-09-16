"use client";

import { useState } from "react";
import {
  ALL_REQUIREMENTS,
  REQUIREMENT_LABELS,
  computeVoterCommitment,
  toHex,
  type RequirementId,
} from "@/lib/simulation";

export function RequirementsGate({
  secretKey,
  required,
  confirmed,
  onToggle,
  unlocked,
  onUnlock,
  eligibleVoters,
}: {
  secretKey: Uint8Array;
  required: RequirementId[];
  confirmed: Set<RequirementId>;
  onToggle: (id: RequirementId) => void;
  unlocked: boolean;
  onUnlock: () => void;
  eligibleVoters: Set<string>;
}) {
  const [pasted, setPasted] = useState("");
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const allConfirmed = required.every((r) => confirmed.has(r));
  const myCommitment = toHex(computeVoterCommitment(secretKey));
  const isRegistered = eligibleVoters.has(myCommitment);

  const handleUnlockAttempt = () => {
    setUnlockError(null);
    if (pasted.trim().toLowerCase() !== myCommitment) {
      setUnlockError("That doesn't match your verification hash.");
      return;
    }
    if (!isRegistered) {
      setUnlockError(
        "This hash is correct, but the admin hasn't added it yet. Share it with them first."
      );
      return;
    }
    onUnlock();
  };

  if (unlocked) {
    return (
      <div className="glass-panel p-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="pill bg-emerald/10 border-emerald/30 text-emerald">
            Verified
          </span>
          <p className="text-sm text-ink-dim">Voting unlocked for this session.</p>
        </div>
        <p className="font-mono text-xs text-ink-faint mt-3 break-all">
          {myCommitment}
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel p-5">
      <h3 className="text-sm font-semibold text-ink mb-1">
        Voter requirements
      </h3>
      <p className="text-xs text-ink-dim mb-4">
        Demo only. These are self-confirmed labels, not real verification.
        No wallet, KYC provider, or NFT check actually runs.
      </p>

      <div className="space-y-2 mb-4">
        {ALL_REQUIREMENTS.filter((r) => required.includes(r)).map((r) => (
          <label
            key={r}
            className="flex items-center gap-2.5 text-sm text-ink cursor-pointer"
          >
            <input
              type="checkbox"
              checked={confirmed.has(r)}
              onChange={() => onToggle(r)}
              className="w-4 h-4 rounded border-border bg-surface accent-cyan"
            />
            {REQUIREMENT_LABELS[r]}
          </label>
        ))}
      </div>

      {allConfirmed ? (
        <div className="pt-4 border-t border-border/60">
          <p className="text-xs text-ink-dim mb-2">
            Requirements met. Your verification hash:
          </p>
          <p className="font-mono text-xs bg-surface/80 border border-border rounded-md px-3 py-2 break-all mb-3">
            {myCommitment}
          </p>
          <div className="flex gap-2">
            <input
              value={pasted}
              onChange={(e) => {
                setPasted(e.target.value);
                setUnlockError(null);
              }}
              placeholder="Paste your verification hash to unlock voting"
              className="glass-input flex-1 font-mono text-xs"
            />
            <button
              onClick={handleUnlockAttempt}
              className="btn-primary px-4 py-2 text-sm shrink-0"
            >
              Unlock
            </button>
          </div>
          <button
            onClick={() => setPasted(myCommitment)}
            className="text-xs text-cyan hover:text-cyan-bright mt-2"
          >
            Fill in for me (demo)
          </button>
          {unlockError && (
            <p className="text-xs text-amber mt-3">{unlockError}</p>
          )}
        </div>
      ) : (
        <p className="text-xs text-amber">
          Confirm all requirements above to generate your verification hash.
        </p>
      )}
    </div>
  );
}
