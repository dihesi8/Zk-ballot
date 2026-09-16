// pkgs/contract/src/witnesses.ts
//
// Implements the witness functions declared in ballot.compact
// (`adminSecretKey`, `voterSecretKey`). Both simply return the same local
// secret key — role (admin vs. eligible voter) is enforced by the CIRCUIT
// logic (comparing derived commitments against `admin` / `eligibleVoters`
// on-chain), not by which witness function is called. A single wallet
// running this CLI has one secret key; whether that key is authorized as
// admin or as a voter is a question the contract answers, not the client.

import type { WitnessContext } from "@midnight-ntwrk/compact-runtime";
import type { Ledger, Witnesses } from "../managed/ballot/contract/index.js";

export type BallotPrivateState = {
  readonly secretKey: Uint8Array;
};

export const createBallotPrivateState = (
  secretKey: Uint8Array
): BallotPrivateState => ({ secretKey });

export const witnesses: Witnesses<BallotPrivateState> = {
  adminSecretKey: ({
    privateState,
  }: WitnessContext<Ledger, BallotPrivateState>): [
    BallotPrivateState,
    Uint8Array
  ] => [privateState, privateState.secretKey],

  voterSecretKey: ({
    privateState,
  }: WitnessContext<Ledger, BallotPrivateState>): [
    BallotPrivateState,
    Uint8Array
  ] => [privateState, privateState.secretKey],
};
