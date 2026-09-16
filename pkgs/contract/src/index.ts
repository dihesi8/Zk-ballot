// pkgs/contract/src/index.ts
//
// TS wrapper re-exporting the compiled Compact contract for pkgs/cli and
// pkgs/app to import, based on the actual generated
// managed/ballot/contract/index.d.ts (confirmed via local compile output).
//
// Notes on the generated types worth remembering downstream:
//   - Contract<PS, W extends Witnesses<PS>> — PS is the private-state type,
//     supplied by whatever witness implementation we write in pkgs/cli /
//     pkgs/app (adminSecretKey / voterSecretKey).
//   - castVote's voteChoice and addEligibleVoter's voterCommitment are
//     typed as `bigint` / `Uint8Array` in JS, not `number` / `string` —
//     the CLI and app witness/circuit-call code must convert accordingly.
//   - `ledger(state)` is a free function that reads the public Ledger shape
//     (proposalId, admin, eligibleVoters, usedNullifiers, tallyOptionA/B)
//     from raw contract state — this is what the frontend polls for the
//     live tally display.

export {
  Contract,
  ledger,
  pureCircuits,
  contractReferenceLocations,
} from "../managed/ballot/contract/index.js";

export type {
  Witnesses,
  Ledger,
  Circuits,
  ImpureCircuits,
  ProvableCircuits,
  PureCircuits,
  ContractReferenceLocations,
} from "../managed/ballot/contract/index.js";
