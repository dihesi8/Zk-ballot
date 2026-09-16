// pkgs/shared/src/common-types.ts
//
// Type aliases for the ballot contract's generic types.
//
// PRAGMATIC NOTE (Option B — deliberate scope-narrowing, logged here so
// it's easy to find and revisit): `midnight-js-contracts`'s `Contract.Any` /
// `Contract.PrivateState<C>` etc. refer to @midnight-ntwrk/compact-js's own
// abstract Contract<PS> interface — a DIFFERENT type from the plain
// generated `Contract` class in managed/ballot/contract/index.js. Getting
// these two type systems to line up precisely turned into deep Effect-TS
// generic-inference work with diminishing returns for a Wave 1 deadline.
// We've deliberately loosened the SDK-boundary types here (BallotProviders,
// DeployedBallotContract) rather than continuing to chase exact generic
// alignment. This does NOT weaken the contract's actual privacy/correctness
// guarantees — those are enforced by the compiled circuit and the ZK proof
// itself at the Compact layer, not by these TypeScript types. It just means
// less compile-time safety specifically at the deploy/join SDK boundary.
// Worth tightening post-Wave-1 if time allows.

import { type MidnightProviders } from "@midnight-ntwrk/midnight-js-types";
import { type FoundContract } from "@midnight-ntwrk/midnight-js-contracts";
import type {
  Contract,
  Witnesses,
} from "../../contract/managed/ballot/contract/index.js";
import type { BallotPrivateState } from "../../contract/src/witnesses.js";

export const ballotPrivateStateKey = "ballotPrivateState";
export type PrivateStateId = typeof ballotPrivateStateKey;

export type PrivateStates = {
  readonly ballotPrivateState: BallotPrivateState;
};

export type BallotContract = Contract<
  BallotPrivateState,
  Witnesses<BallotPrivateState>
>;

export type BallotCircuitKeys = Exclude<
  keyof BallotContract["impureCircuits"],
  number | symbol
>;

// Loosened to `string` circuit keys and `unknown` private state rather than
// forcing exact alignment with Contract.PrivateState<C> — see note above.
export type BallotProviders = MidnightProviders<
  string,
  PrivateStateId,
  unknown
>;

// Loosened to `any` rather than `FoundContract<BallotContract>` — see note
// above. Downstream code (BallotAPI) still works with our real
// BallotContract-shaped object at runtime; this only relaxes the
// compile-time check at the SDK boundary.
export type DeployedBallotContract = FoundContract<any>;

// Public tally + a couple of admin/voter-specific computed fields.
export type BallotDerivedState = {
  readonly proposalId: Uint8Array;
  readonly tallyOptionA: bigint;
  readonly tallyOptionB: bigint;
  readonly eligibleVoterCount: bigint;
  readonly usedNullifierCount: bigint;
  readonly isAdmin: boolean;
};
