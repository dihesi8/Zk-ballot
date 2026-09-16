// pkgs/shared/src/api.ts
//
// Reusable API layer for ballot contract interactions, shared between
// pkgs/cli and pkgs/app. Adapted from Midnight's official bulletin-board
// tutorial pattern (BBoardAPI ->
// docs.midnight.network/tutorials/bboard/bboard-api-implementation),
// restructured for ballot.compact's addEligibleVoter/castVote/tally shape.

import * as Ballot from "../../contract/managed/ballot/contract/index.js";
import {
  type ContractAddress,
} from "@midnight-ntwrk/midnight-js-protocol/compact-runtime";
import { type Logger } from "pino";
import {
  type BallotDerivedState,
  type BallotContract,
  type BallotProviders,
  type DeployedBallotContract,
  ballotPrivateStateKey,
} from "./common-types.js";
import { deployContract, findDeployedContract } from "@midnight-ntwrk/midnight-js-contracts";
import { combineLatest, map, tap, from, type Observable } from "rxjs";
import { toHex } from "@midnight-ntwrk/midnight-js-utils";
import {
  type BallotPrivateState,
  createBallotPrivateState,
} from "../../contract/src/witnesses.js";
import { CompiledBallotContract } from "../../contract/src/compiled.js";
import * as utils from "./utils.js";
import { computeAdminCommitment } from "./commitments.js";

export interface DeployedBallotAPI {
  readonly deployedContractAddress: ContractAddress;
  readonly state$: Observable<BallotDerivedState>;
  addEligibleVoter: (voterCommitment: Uint8Array) => Promise<void>;
  castVote: (voteChoice: 0 | 1) => Promise<void>;
}

export class BallotAPI implements DeployedBallotAPI {
  private constructor(
    public readonly deployedContract: DeployedBallotContract,
    providers: BallotProviders,
    private readonly logger?: Logger
  ) {
    this.deployedContractAddress =
      deployedContract.deployTxData.public.contractAddress;
    providers.privateStateProvider.setContractAddress(
      this.deployedContractAddress
    );

    this.state$ = combineLatest(
      [
        providers.publicDataProvider
          .contractStateObservable(this.deployedContractAddress, {
            type: "latest",
          })
          .pipe(
            map((contractState) => Ballot.ledger(contractState.data)),
            tap((ledgerState) =>
              logger?.trace({
                ledgerStateChanged: {
                  proposalId: toHex(ledgerState.proposalId),
                  admin: toHex(ledgerState.admin),
                  tallyOptionA: ledgerState.tallyOptionA.toString(),
                  tallyOptionB: ledgerState.tallyOptionB.toString(),
                },
              })
            )
          ),
        from(
          providers.privateStateProvider.get(
            ballotPrivateStateKey
          ) as Promise<BallotPrivateState>
        ),
      ],
      (ledgerState, privateState) => {
        const adminCommitment = computeAdminCommitment(privateState.secretKey);
        const isAdmin = toHex(ledgerState.admin) === toHex(adminCommitment);

        return {
          proposalId: ledgerState.proposalId,
          tallyOptionA: ledgerState.tallyOptionA,
          tallyOptionB: ledgerState.tallyOptionB,
          eligibleVoterCount: ledgerState.eligibleVoters.size(),
          usedNullifierCount: ledgerState.usedNullifiers.size(),
          isAdmin,
        };
      }
    );
  }

  readonly deployedContractAddress: ContractAddress;
  readonly state$: Observable<BallotDerivedState>;

  async addEligibleVoter(voterCommitment: Uint8Array): Promise<void> {
    this.logger?.info(`addEligibleVoter`);
    const txData = await this.deployedContract.callTx.addEligibleVoter(
      voterCommitment
    );
    this.logger?.trace({
      transactionAdded: {
        circuit: "addEligibleVoter",
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
      },
    });
  }

  async castVote(voteChoice: 0 | 1): Promise<void> {
    this.logger?.info(`castVote: ${voteChoice}`);
    const txData = await this.deployedContract.callTx.castVote(
      BigInt(voteChoice)
    );
    this.logger?.trace({
      transactionAdded: {
        circuit: "castVote",
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
      },
    });
  }

  static async deploy(
    providers: BallotProviders,
    proposalId: Uint8Array,
    adminPublicCommitment: Uint8Array,
    secretKey: Uint8Array,
    logger?: Logger
  ): Promise<BallotAPI> {
    logger?.info("deployContract");
    // Property name confirmed from the compiler error: this SDK version
    // expects `compiledContract`, not `contract`, and it must be the
    // CompiledContract binding, not a raw `new Contract(witnesses)`
    // instance — both confirmed via real errors/type defs, not guesses.
    //
    // Cast: as of common-types.ts's "Option B" note, deployContract's
    // return type is built on compact-js's own Contract<PS> generic
    // system, which doesn't line up cleanly with our generated managed
    // Contract class without deep Effect-TS inference work. Casting here
    // rather than continuing to chase exact generic alignment — the
    // runtime object is correct (it's what the SDK actually returns),
    // only the compile-time type is being relaxed.
    const deployedBallotContract = (await deployContract(providers, {
      compiledContract: CompiledBallotContract,
      privateStateId: ballotPrivateStateKey,
      initialPrivateState: createBallotPrivateState(secretKey),
      args: [proposalId, adminPublicCommitment],
    } as never)) as DeployedBallotContract;
    logger?.trace({
      contractDeployed: {
        finalizedDeployTxData: deployedBallotContract.deployTxData.public,
      },
    });
    return new BallotAPI(deployedBallotContract, providers, logger);
  }

  static async join(
    providers: BallotProviders,
    contractAddress: ContractAddress,
    logger?: Logger
  ): Promise<BallotAPI> {
    logger?.info({ joinContract: { contractAddress } });
    // Same Option B cast as deploy() above — see the note there.
    const deployedBallotContract = (await findDeployedContract(providers, {
      contractAddress,
      compiledContract: CompiledBallotContract,
      privateStateId: ballotPrivateStateKey,
      initialPrivateState: await BallotAPI.getPrivateState(
        providers,
        contractAddress
      ),
    } as never)) as DeployedBallotContract;
    logger?.trace({
      contractJoined: {
        finalizedDeployTxData: deployedBallotContract.deployTxData.public,
      },
    });
    return new BallotAPI(deployedBallotContract, providers, logger);
  }

  private static async getPrivateState(
    providers: BallotProviders,
    contractAddress: ContractAddress
  ): Promise<BallotPrivateState> {
    providers.privateStateProvider.setContractAddress(contractAddress);
    const existingPrivateState = (await providers.privateStateProvider.get(
      ballotPrivateStateKey
    )) as BallotPrivateState | null;
    return (
      existingPrivateState ?? createBallotPrivateState(utils.randomBytes(32))
    );
  }
}

export * as utils from "./utils.js";
export * from "./common-types.js";
