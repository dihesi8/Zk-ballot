// pkgs/app/src/lib/simulation.ts
//
// WAVE 1 STATUS: real commitment/nullifier/result-digest hashing (via
// @midnight-ntwrk/compact-runtime's persistentHash — same primitive
// ballot.compact uses on-chain), running against an in-browser simulated
// registry instead of a deployed contract. See CHANGELOG.md for the full
// technical trail on why, and README.md for current vs. Wave 2 scope.
//
// SCOPE NOTE: the compiled contract (ballot.compact) currently handles a
// SINGLE proposal. Multi-proposal support here is a simulation/frontend-
// layer feature for Wave 1 speed — cryptographically it already works
// (nullifier = hash(secretKey, proposalId), so distinct proposals
// naturally get distinct nullifiers per voter), but the contract itself
// would need a Map-based ledger to support this for real. Documented as
// Wave 2 contract work, not silently glossed over.
//
// "Requirements" (token holding, KYC, etc.) are demo-only labels a voter
// self-confirms via checkbox — no real verification happens or is implied.

import {
  computeAdminCommitment,
  computeVoterCommitment,
  computeNullifier,
  computeResultDigest,
} from "@zk-ballot/core";

export type VoteChoice = "yes" | "no";

export type RequirementId = "token" | "kyc" | "nft" | "social";

export const REQUIREMENT_LABELS: Record<RequirementId, string> = {
  token: "Governance token holding",
  kyc: "KYC verification",
  nft: "NFT membership badge",
  social: "Linked social proof",
};

export const ALL_REQUIREMENTS: RequirementId[] = [
  "token",
  "kyc",
  "nft",
  "social",
];

export interface Proposal {
  id: string; // hex — also serves as the nullifier-derivation proposalId
  idBytes: Uint8Array;
  title: string;
  description: string;
  createdAt: number;
  status: "active" | "closed";
  tallyYes: number;
  tallyNo: number;
  usedNullifiers: Set<string>;
  closedAt?: number;
  resultDigest?: string; // hex, set once closed
}

export interface FeedbackReply {
  id: string;
  text: string;
  createdAt: number;
}

export interface FeedbackItem {
  id: string;
  text: string;
  createdAt: number;
  replies: FeedbackReply[];
}

export interface BallotRegistry {
  admin: Uint8Array;
  requirements: RequirementId[];
  eligibleVoters: Set<string>; // hex commitments
  proposals: Proposal[];
  feedback: FeedbackItem[];
}

export class SimulationError extends Error {}

export const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

export const randomBytes32 = (): Uint8Array => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytes;
};

const randomId = (): string => toHex(randomBytes32()).slice(0, 16);

export const createRegistry = (
  adminSecretKey: Uint8Array,
  requirements: RequirementId[] = ["token"]
): BallotRegistry => ({
  admin: computeAdminCommitment(adminSecretKey),
  requirements,
  eligibleVoters: new Set(),
  proposals: [],
  feedback: [],
});

const assertIsAdmin = (registry: BallotRegistry, adminSecretKey: Uint8Array) => {
  if (toHex(computeAdminCommitment(adminSecretKey)) !== toHex(registry.admin)) {
    throw new SimulationError("only admin can perform this action");
  }
};

export const setRequirements = (
  registry: BallotRegistry,
  adminSecretKey: Uint8Array,
  requirements: RequirementId[]
): BallotRegistry => {
  assertIsAdmin(registry, adminSecretKey);
  return { ...registry, requirements };
};

export const addEligibleVoter = (
  registry: BallotRegistry,
  adminSecretKey: Uint8Array,
  voterCommitmentHex: string
): BallotRegistry => {
  assertIsAdmin(registry, adminSecretKey);
  const eligibleVoters = new Set(registry.eligibleVoters);
  eligibleVoters.add(voterCommitmentHex.toLowerCase());
  return { ...registry, eligibleVoters };
};

export const hasMetRequirements = (
  registry: BallotRegistry,
  confirmed: Set<RequirementId>
): boolean => registry.requirements.every((r) => confirmed.has(r));

export const createProposal = (
  registry: BallotRegistry,
  adminSecretKey: Uint8Array,
  title: string,
  description: string
): BallotRegistry => {
  assertIsAdmin(registry, adminSecretKey);
  const idBytes = randomBytes32();
  const proposal: Proposal = {
    id: toHex(idBytes),
    idBytes,
    title,
    description,
    createdAt: Date.now(),
    status: "active",
    tallyYes: 0,
    tallyNo: 0,
    usedNullifiers: new Set(),
  };
  return { ...registry, proposals: [proposal, ...registry.proposals] };
};

export const closeProposal = (
  registry: BallotRegistry,
  adminSecretKey: Uint8Array,
  proposalId: string
): BallotRegistry => {
  assertIsAdmin(registry, adminSecretKey);
  const proposals = registry.proposals.map((p) => {
    if (p.id !== proposalId) return p;
    if (p.status === "closed") {
      throw new SimulationError("proposal already closed");
    }
    const digest = toHex(computeResultDigest(p.idBytes, p.tallyYes, p.tallyNo));
    return { ...p, status: "closed" as const, closedAt: Date.now(), resultDigest: digest };
  });
  return { ...registry, proposals };
};

export const castVote = (
  registry: BallotRegistry,
  proposalId: string,
  voterSecretKey: Uint8Array,
  choice: VoteChoice
): BallotRegistry => {
  const voterCommitment = toHex(computeVoterCommitment(voterSecretKey));
  if (!registry.eligibleVoters.has(voterCommitment)) {
    throw new SimulationError("not eligible: verification hash not registered");
  }

  const proposal = registry.proposals.find((p) => p.id === proposalId);
  if (!proposal) throw new SimulationError("proposal not found");
  if (proposal.status === "closed") {
    throw new SimulationError("voting has closed for this proposal");
  }

  const nullifier = toHex(computeNullifier(voterSecretKey, proposal.idBytes));
  if (proposal.usedNullifiers.has(nullifier)) {
    throw new SimulationError("already voted on this proposal");
  }

  const proposals = registry.proposals.map((p) => {
    if (p.id !== proposalId) return p;
    const usedNullifiers = new Set(p.usedNullifiers);
    usedNullifiers.add(nullifier);
    return {
      ...p,
      usedNullifiers,
      tallyYes: choice === "yes" ? p.tallyYes + 1 : p.tallyYes,
      tallyNo: choice === "no" ? p.tallyNo + 1 : p.tallyNo,
    };
  });
  return { ...registry, proposals };
};

/** Anonymous by design — no commitment or identity attached at all. */
export const addFeedback = (
  registry: BallotRegistry,
  text: string
): BallotRegistry => {
  const trimmed = text.trim();
  if (!trimmed) throw new SimulationError("feedback cannot be empty");
  const item: FeedbackItem = {
    id: randomId(),
    text: trimmed,
    createdAt: Date.now(),
    replies: [],
  };
  return { ...registry, feedback: [item, ...registry.feedback] };
};

export const replyToFeedback = (
  registry: BallotRegistry,
  adminSecretKey: Uint8Array,
  feedbackId: string,
  text: string
): BallotRegistry => {
  assertIsAdmin(registry, adminSecretKey);
  const trimmed = text.trim();
  if (!trimmed) throw new SimulationError("reply cannot be empty");
  const feedback = registry.feedback.map((f) =>
    f.id === feedbackId
      ? {
          ...f,
          replies: [
            ...f.replies,
            { id: randomId(), text: trimmed, createdAt: Date.now() },
          ],
        }
      : f
  );
  return { ...registry, feedback };
};

export const hasVotedOnProposal = (
  secretKey: Uint8Array,
  proposal: Proposal
): boolean => {
  const nullifier = toHex(computeNullifier(secretKey, proposal.idBytes));
  return proposal.usedNullifiers.has(nullifier);
};

export { computeAdminCommitment, computeVoterCommitment };
