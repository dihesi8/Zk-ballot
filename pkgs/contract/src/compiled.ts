// pkgs/contract/src/compiled.ts
//
// Binds the compiled Compact artifacts, the witness implementations, and
// the generated Contract class into a single CompiledContract object.
// This is what deployContract() / findDeployedContract() actually accept
// as `compiledContract` — NOT a raw `new Contract(witnesses)` instance.

import { CompiledContract } from "@midnight-ntwrk/compact-js";
import * as ManagedBallot from "../managed/ballot/contract/index.js";
import { witnesses, type BallotPrivateState } from "./witnesses.js";

type BallotContractType = ManagedBallot.Contract<BallotPrivateState>;

const baseCompiledContract = CompiledContract.make<BallotContractType>("Ballot", ManagedBallot.Contract<BallotPrivateState>);

export const CompiledBallotContract = baseCompiledContract.pipe(
  CompiledContract.withWitnesses(witnesses),
  CompiledContract.withCompiledFileAssets("../managed/ballot")
);
