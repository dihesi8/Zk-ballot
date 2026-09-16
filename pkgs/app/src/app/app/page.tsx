"use client";

import { useRef, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { RequirementsGate } from "@/components/RequirementsGate";
import { RegistryPanel } from "@/components/RegistryPanel";
import { AdminProposalsPanel, VoterProposalsPanel } from "@/components/ProposalsPanel";
import { FeedbackPanel } from "@/components/FeedbackPanel";
import {
  createRegistry,
  addEligibleVoter,
  setRequirements,
  createProposal,
  closeProposal,
  castVote,
  addFeedback,
  replyToFeedback,
  computeVoterCommitment,
  hasVotedOnProposal,
  toHex,
  randomBytes32,
  SimulationError,
  type BallotRegistry,
  type RequirementId,
  type VoteChoice,
} from "@/lib/simulation";

type Role = "admin" | 0 | 1 | 2;

interface VoterSession {
  confirmed: Set<RequirementId>;
  unlocked: boolean;
}

const emptySession = (): VoterSession => ({ confirmed: new Set(), unlocked: false });

export default function Home() {
  const [identities] = useState(() => ({
    admin: randomBytes32(),
    voters: [randomBytes32(), randomBytes32(), randomBytes32()] as [
      Uint8Array,
      Uint8Array,
      Uint8Array
    ],
  }));

  const [registry, setRegistry] = useState<BallotRegistry>(() =>
    createRegistry(identities.admin, ["token"])
  );
  const [role, setRole] = useState<Role>("admin");
  const [sessions, setSessions] = useState<Record<0 | 1 | 2, VoterSession>>({
    0: emptySession(),
    1: emptySession(),
    2: emptySession(),
  });
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [pastedCommitment, setPastedCommitment] = useState("");
  const messageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = (kind: "success" | "error", text: string) => {
    setMessage({ kind, text });
    if (messageTimer.current) window.clearTimeout(messageTimer.current);
    messageTimer.current = setTimeout(() => setMessage(null), 4000);
  };

  const runAdmin = (fn: (r: BallotRegistry, sk: Uint8Array) => BallotRegistry, okMsg: string) => {
    try {
      const next = fn(registry, identities.admin);
      setRegistry(next);
      notify("success", okMsg);
    } catch (e) {
      notify("error", e instanceof SimulationError ? e.message : "Unknown error.");
    }
  };

  const currentVoterIndex = role === "admin" ? null : role;
  const currentSecretKey = role === "admin" ? identities.admin : identities.voters[role];
  const currentSession = currentVoterIndex !== null ? sessions[currentVoterIndex] : null;

  const toggleRequirementConfirmed = (id: RequirementId) => {
    if (currentVoterIndex === null) return;
    setSessions((s) => {
      const session = s[currentVoterIndex];
      const confirmed = new Set(session.confirmed);
      confirmed.has(id) ? confirmed.delete(id) : confirmed.add(id);
      return { ...s, [currentVoterIndex]: { ...session, confirmed } };
    });
  };

  const unlockVoting = () => {
    if (currentVoterIndex === null) return;
    setSessions((s) => ({
      ...s,
      [currentVoterIndex]: { ...s[currentVoterIndex], unlocked: true },
    }));
  };

  const handleVote = (proposalId: string, choice: VoteChoice) => {
    if (currentVoterIndex === null) return;
    try {
      const next = castVote(registry, proposalId, currentSecretKey, choice);
      setRegistry(next);
      notify("success", `Vote cast for ${choice === "yes" ? "Yes" : "No"}.`);
    } catch (e) {
      notify("error", e instanceof SimulationError ? e.message : "Unknown error.");
    }
  };

  const votedIds =
    currentVoterIndex !== null
      ? new Set(
          registry.proposals
            .filter((p) => hasVotedOnProposal(currentSecretKey, p))
            .map((p) => p.id)
        )
      : new Set<string>();

  return (
    <main className="min-h-screen pb-16">
      <Header role={role} onRoleChange={setRole} />

      <div className="mx-auto max-w-6xl px-6 pt-6">
        {/* Stat strip */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="glass-panel px-5 py-3">
            <p className="text-[11px] uppercase tracking-wide text-ink-faint">Proposals</p>
            <p className="font-mono text-xl text-ink mt-0.5">{registry.proposals.length}</p>
          </div>
          <div className="glass-panel px-5 py-3">
            <p className="text-[11px] uppercase tracking-wide text-ink-faint">Eligible voters</p>
            <p className="font-mono text-xl text-ink mt-0.5">{registry.eligibleVoters.size}</p>
          </div>
          <div className="glass-panel px-5 py-3">
            <p className="text-[11px] uppercase tracking-wide text-ink-faint">Total votes cast</p>
            <p className="font-mono text-xl text-ink mt-0.5">
              {registry.proposals.reduce((sum, p) => sum + p.usedNullifiers.size, 0)}
            </p>
          </div>
        </div>

        {message && (
          <div
            className={`mb-6 text-sm px-4 py-2.5 rounded-md border ${
              message.kind === "error"
                ? "border-rose/40 bg-rose/10 text-rose"
                : "border-emerald/40 bg-emerald/10 text-emerald"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-[1fr_360px] gap-6">
          <div className="space-y-6">
            {role === "admin" ? (
              <AdminProposalsPanel
                proposals={registry.proposals}
                onCreate={(title, description) =>
                  runAdmin(
                    (r, sk) => createProposal(r, sk, title, description),
                    "Proposal published."
                  )
                }
                onClose={(id) =>
                  runAdmin((r, sk) => closeProposal(r, sk, id), "Voting closed. Result digest generated.")
                }
              />
            ) : (
              <VoterProposalsPanel
                proposals={registry.proposals}
                unlocked={currentSession?.unlocked ?? false}
                votedIds={votedIds}
                onVote={handleVote}
              />
            )}

            <FeedbackPanel
              feedback={registry.feedback}
              isAdmin={role === "admin"}
              onSubmit={(text) => {
                try {
                  const next = addFeedback(registry, text);
                  setRegistry(next);
                } catch (e) {
                  notify("error", e instanceof SimulationError ? e.message : "Unknown error.");
                }
              }}
              onReply={(feedbackId, text) =>
                runAdmin((r, sk) => replyToFeedback(r, sk, feedbackId, text), "Reply posted.")
              }
            />
          </div>

          <div>
            {role === "admin" ? (
              <RegistryPanel
                requirements={registry.requirements}
                onToggleRequirement={(id) => {
                  const next = registry.requirements.includes(id)
                    ? registry.requirements.filter((r) => r !== id)
                    : [...registry.requirements, id];
                  runAdmin((r, sk) => setRequirements(r, sk, next), "Requirements updated.");
                }}
                pastedCommitment={pastedCommitment}
                onPastedCommitmentChange={setPastedCommitment}
                onAdd={() => {
                  runAdmin(
                    (r, sk) => addEligibleVoter(r, sk, pastedCommitment),
                    "Eligible voter added."
                  );
                  setPastedCommitment("");
                }}
                quickAdd={identities.voters.map((sk, i) => ({
                  label: `Voter ${i + 1}`,
                  add: () =>
                    runAdmin(
                      (r, adminSk) =>
                        addEligibleVoter(r, adminSk, toHex(computeVoterCommitment(sk))),
                      `Voter ${i + 1} added.`
                    ),
                }))}
                eligibleVoters={registry.eligibleVoters}
              />
            ) : (
              currentSession && (
                <RequirementsGate
                  secretKey={currentSecretKey}
                  required={registry.requirements}
                  confirmed={currentSession.confirmed}
                  onToggle={toggleRequirementConfirmed}
                  unlocked={currentSession.unlocked}
                  onUnlock={unlockVoting}
                  eligibleVoters={registry.eligibleVoters}
                />
              )
            )}
          </div>
        </div>

        <footer className="mt-10 text-xs text-ink-faint leading-relaxed">
          Wave 1: this demo runs the real commitment, nullifier, and
          result digest hashing (via{" "}
          <code className="font-mono">@midnight-ntwrk/compact-runtime</code>)
          locally in your browser, matching{" "}
          <code className="font-mono">ballot.compact</code> exactly.
          Requirements (token, KYC, NFT, social) are demo-only
          self-confirmed labels. No real verification runs. Live testnet
          deployment and wallet connection are planned for Wave 2, see
          CHANGELOG.md.
        </footer>
      </div>
      <Footer />
    </main>
  );
}
