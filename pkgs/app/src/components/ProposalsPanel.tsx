"use client";

import { useState } from "react";
import type { Proposal, VoteChoice } from "@/lib/simulation";

function shortHex(hex: string, len = 10): string {
  return `${hex.slice(0, len)}…${hex.slice(-4)}`;
}

function TallyBar({ yes, no }: { yes: number; no: number }) {
  const total = yes + no;
  const yesPct = total === 0 ? 50 : Math.round((yes / total) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs text-ink-dim mb-1">
        <span>Yes {yes}</span>
        <span>No {no}</span>
      </div>
      <div className="h-1.5 rounded-full bg-surface overflow-hidden flex">
        <div className="h-full bg-emerald" style={{ width: `${yesPct}%` }} />
        <div className="h-full bg-rose" style={{ width: `${100 - yesPct}%` }} />
      </div>
    </div>
  );
}

export function AdminProposalsPanel({
  proposals,
  onCreate,
  onClose,
}: {
  proposals: Proposal[];
  onCreate: (title: string, description: string) => void;
  onClose: (id: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  return (
    <div className="space-y-4">
      <div className="glass-panel p-5">
        <h3 className="text-sm font-semibold text-ink mb-3">
          Send a new proposal
        </h3>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Proposal title"
          className="glass-input w-full mb-2"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          rows={2}
          className="glass-input w-full mb-3 resize-none"
        />
        <button
          onClick={() => {
            if (!title.trim()) return;
            onCreate(title.trim(), description.trim());
            setTitle("");
            setDescription("");
          }}
          disabled={!title.trim()}
          className="btn-primary w-full py-2 text-sm"
        >
          Publish proposal
        </button>
      </div>

      {proposals.map((p) => (
        <div key={p.id} className="glass-panel p-5">
          <div className="flex items-start justify-between mb-1">
            <h4 className="text-sm font-semibold text-ink">{p.title}</h4>
            <span
              className={`pill ${
                p.status === "active"
                  ? "bg-cyan/10 border-cyan/40 text-cyan-bright"
                  : "border-border text-ink-faint"
              }`}
            >
              {p.status}
            </span>
          </div>
          {p.description && (
            <p className="text-xs text-ink-dim mb-3">{p.description}</p>
          )}
          <TallyBar yes={p.tallyYes} no={p.tallyNo} />
          {p.status === "active" ? (
            <button
              onClick={() => onClose(p.id)}
              className="btn-secondary w-full py-1.5 text-xs mt-4"
            >
              Close voting
            </button>
          ) : (
            <div className="mt-4 pt-3 border-t border-border/60">
              <p className="text-[11px] uppercase tracking-wide text-ink-faint mb-1">
                Result digest
              </p>
              <p className="font-mono text-[11px] text-ink-dim break-all">
                {p.resultDigest && shortHex(p.resultDigest, 24)}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function VoterProposalsPanel({
  proposals,
  unlocked,
  votedIds,
  onVote,
}: {
  proposals: Proposal[];
  unlocked: boolean;
  votedIds: Set<string>;
  onVote: (id: string, choice: VoteChoice) => void;
}) {
  if (proposals.length === 0) {
    return (
      <div className="glass-panel p-5 text-sm text-ink-faint italic">
        No proposals yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {proposals.map((p) => {
        const alreadyVoted = votedIds.has(p.id);
        const canVote = unlocked && p.status === "active" && !alreadyVoted;
        return (
          <div key={p.id} className="glass-panel p-5">
            <div className="flex items-start justify-between mb-1">
              <h4 className="text-sm font-semibold text-ink">{p.title}</h4>
              <span
                className={`pill ${
                  p.status === "active"
                    ? "bg-cyan/10 border-cyan/40 text-cyan-bright"
                    : "border-border text-ink-faint"
                }`}
              >
                {p.status}
              </span>
            </div>
            {p.description && (
              <p className="text-xs text-ink-dim mb-3">{p.description}</p>
            )}
            <TallyBar yes={p.tallyYes} no={p.tallyNo} />

            {p.status === "closed" ? (
              <div className="mt-4 pt-3 border-t border-border/60">
                <p className="text-[11px] uppercase tracking-wide text-ink-faint mb-1">
                  Result digest
                </p>
                <p className="font-mono text-[11px] text-ink-dim break-all">
                  {p.resultDigest && shortHex(p.resultDigest, 24)}
                </p>
              </div>
            ) : alreadyVoted ? (
              <p className="text-xs text-emerald mt-4">You voted on this proposal.</p>
            ) : (
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => onVote(p.id, "yes")}
                  disabled={!canVote}
                  className="btn-secondary flex-1 py-2 text-sm"
                >
                  Vote Yes
                </button>
                <button
                  onClick={() => onVote(p.id, "no")}
                  disabled={!canVote}
                  className="btn-secondary flex-1 py-2 text-sm"
                >
                  Vote No
                </button>
              </div>
            )}
            {!unlocked && p.status === "active" && !alreadyVoted && (
              <p className="text-[11px] text-amber mt-2">
                Unlock voting via your verification hash first.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
