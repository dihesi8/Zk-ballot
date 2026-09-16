// pkgs/cli/src/index.ts
//
// Main interactive CLI for zk-ballot, adapted from Midnight's official
// bulletin-board CLI tutorial pattern, restructured for our
// addEligibleVoter/castVote/tally circuits and the voter-self-commitment
// privacy flow (see pkgs/shared/src/commitments.ts for why admin never
// sees a voter's raw secret key).

import { createInterface, type Interface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { WebSocket } from "ws";
import {
  BallotAPI,
  type BallotDerivedState,
  ballotPrivateStateKey,
  type BallotProviders,
  type DeployedBallotContract,
  type PrivateStateId,
  computeVoterCommitment,
  computeAdminCommitment,
} from "@zk-ballot/shared";
import { type WalletFacade } from "@midnight-ntwrk/wallet-sdk-facade";
import { ledger, type Ledger } from "../../contract/managed/ballot/contract/index.js";
import { NodeZkConfigProvider } from "@midnight-ntwrk/midnight-js-node-zk-config-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { type Logger } from "pino";
import { type Config, StandaloneConfig } from "./config.js";
import { levelPrivateStateProvider } from "@midnight-ntwrk/midnight-js-level-private-state-provider";
import { type ContractAddress } from "@midnight-ntwrk/midnight-js-protocol/compact-runtime";
import { assertIsContractAddress, toHex } from "@midnight-ntwrk/midnight-js-utils";
import { TestEnvironment } from "@midnight-ntwrk/testkit-js";
import { MidnightWalletProvider } from "./midnight-wallet-provider.js";
import { randomBytes } from "@zk-ballot/shared";
import { unshieldedToken } from "@midnight-ntwrk/midnight-js-protocol/ledger";
import { syncWallet, waitForUnshieldedFunds } from "./wallet-utils.js";
import { generateDust } from "./generate-dust.js";
import { type BallotPrivateState } from "../../contract/src/witnesses.js";

// @ts-expect-error: needed to enable WebSocket usage through apollo
globalThis.WebSocket = WebSocket;

// ---------------------------------------------------------------------
// Query ledger state directly (used for the "display public state" menu
// item — doesn't need a transaction since ledger reads are free).
// ---------------------------------------------------------------------

export const getBallotLedgerState = async (
  providers: BallotProviders,
  contractAddress: ContractAddress
): Promise<Ledger | null> => {
  assertIsContractAddress(contractAddress);
  const contractState = await providers.publicDataProvider.queryContractState(
    contractAddress
  );
  return contractState != null ? ledger(contractState.data) : null;
};

// ---------------------------------------------------------------------
// Deploy or join menu
// ---------------------------------------------------------------------

const DEPLOY_OR_JOIN_QUESTION = `
You can do one of the following:
  1. Deploy a new ballot (you become admin)
  2. Join an existing ballot contract
  3. Exit
Which would you like to do? `;

const deployOrJoin = async (
  providers: BallotProviders,
  secretKey: Uint8Array,
  rli: Interface,
  logger: Logger
): Promise<BallotAPI | null> => {
  while (true) {
    const choice = await rli.question(DEPLOY_OR_JOIN_QUESTION);
    switch (choice) {
      case "1": {
        const proposalId = randomBytes(32);
        const adminCommitment = computeAdminCommitment(secretKey);
        logger.info(`Deploying with proposalId: ${toHex(proposalId)}`);
        const api = await BallotAPI.deploy(
          providers,
          proposalId,
          adminCommitment,
          secretKey,
          logger
        );
        logger.info(`Deployed contract at address: ${api.deployedContractAddress}`);
        logger.info(`You are admin. Your admin commitment: ${toHex(adminCommitment)}`);
        return api;
      }
      case "2": {
        const address = await rli.question("What is the contract address (in hex)? ");
        const api = await BallotAPI.join(providers, address, logger);
        logger.info(`Joined contract at address: ${api.deployedContractAddress}`);
        return api;
      }
      case "3":
        logger.info("Exiting...");
        return null;
      default:
        logger.error(`Invalid choice: ${choice}`);
    }
  }
};

// ---------------------------------------------------------------------
// Display state helpers
// ---------------------------------------------------------------------

const displayLedgerState = async (
  providers: BallotProviders,
  deployedContract: DeployedBallotContract,
  logger: Logger
): Promise<void> => {
  const contractAddress = deployedContract.deployTxData.public.contractAddress;
  const ledgerState = await getBallotLedgerState(providers, contractAddress);
  if (ledgerState === null) {
    logger.info(`No ballot contract deployed at ${contractAddress}`);
  } else {
    logger.info(`Proposal ID: ${toHex(ledgerState.proposalId)}`);
    logger.info(`Admin commitment: ${toHex(ledgerState.admin)}`);
    logger.info(`Eligible voters registered: ${ledgerState.eligibleVoters.size()}`);
    logger.info(`Votes cast so far: ${ledgerState.usedNullifiers.size()}`);
    logger.info(`Tally — Option A: ${ledgerState.tallyOptionA}`);
    logger.info(`Tally — Option B: ${ledgerState.tallyOptionB}`);
  }
};

const displayPrivateState = async (
  providers: BallotProviders,
  logger: Logger
): Promise<void> => {
  const privateState = (await providers.privateStateProvider.get(
    ballotPrivateStateKey
  )) as BallotPrivateState | null;
  if (privateState === null) {
    logger.info("No existing private state");
  } else {
    logger.info(`Your secret key: ${toHex(privateState.secretKey)}`);
    logger.info(`Your admin commitment: ${toHex(computeAdminCommitment(privateState.secretKey))}`);
    logger.info(`Your voter commitment: ${toHex(computeVoterCommitment(privateState.secretKey))}`);
    logger.info(
      `(share ONLY the voter commitment with the admin if you want to be added as an eligible voter — never share your secret key)`
    );
  }
};

const displayDerivedState = (state: BallotDerivedState | undefined, logger: Logger) => {
  if (state === undefined) {
    logger.info("No ballot state currently available");
  } else {
    logger.info(`Tally — Option A: ${state.tallyOptionA}, Option B: ${state.tallyOptionB}`);
    logger.info(`Eligible voters: ${state.eligibleVoterCount}`);
    logger.info(`Votes cast: ${state.usedNullifierCount}`);
    logger.info(`You are: ${state.isAdmin ? "ADMIN" : "not admin"}`);
  }
};

// ---------------------------------------------------------------------
// Main interaction loop
// ---------------------------------------------------------------------

const MAIN_LOOP_QUESTION = `
You can do one of the following:
  1. Show my voter commitment (share this with the admin to be added)
  2. Add an eligible voter (admin only — paste a voter's commitment hash)
  3. Cast a vote
  4. Display the public ledger state
  5. Display my private state
  6. Display derived state (tally + role)
  7. Exit
Which would you like to do? `;

const mainLoop = async (
  providers: BallotProviders,
  secretKey: Uint8Array,
  rli: Interface,
  logger: Logger
): Promise<void> => {
  const ballotApi = await deployOrJoin(providers, secretKey, rli, logger);
  if (ballotApi === null) return;

  let currentState: BallotDerivedState | undefined;
  const subscription = ballotApi.state$.subscribe({
    next: (state) => (currentState = state),
  });

  try {
    while (true) {
      const choice = await rli.question(MAIN_LOOP_QUESTION);
      try {
        switch (choice) {
          case "1": {
            const commitment = computeVoterCommitment(secretKey);
            logger.info(`Your voter commitment: ${toHex(commitment)}`);
            logger.info(`Send this hash to the admin — do NOT share your secret key.`);
            break;
          }
          case "2": {
            const hex = await rli.question("Voter's commitment hash (hex): ");
            const bytes = Buffer.from(hex, "hex");
            await ballotApi.addEligibleVoter(new Uint8Array(bytes));
            logger.info("Eligible voter added.");
            break;
          }
          case "3": {
            const raw = await rli.question("Vote for Option A or B? (A/B): ");
            const choiceNum = raw.trim().toUpperCase() === "A" ? 0 : 1;
            await ballotApi.castVote(choiceNum as 0 | 1);
            logger.info("Vote cast.");
            break;
          }
          case "4":
            await displayLedgerState(providers, ballotApi.deployedContract, logger);
            break;
          case "5":
            await displayPrivateState(providers, logger);
            break;
          case "6":
            displayDerivedState(currentState, logger);
            break;
          case "7":
            logger.info("Exiting...");
            return;
          default:
            logger.error(`Invalid choice: ${choice}`);
        }
      } catch (e) {
        logError(logger, e);
        logger.info("Returning to main menu...");
      }
    }
  } finally {
    subscription.unsubscribe();
  }
};

// ---------------------------------------------------------------------
// Wallet setup menu
// ---------------------------------------------------------------------

const GENESIS_MINT_WALLET_SEED =
  "0000000000000000000000000000000000000000000000000000000000000001";

const WALLET_LOOP_QUESTION = `
You can do one of the following:
  1. Build a fresh wallet
  2. Build wallet from a seed
  3. Exit
Which would you like to do? `;

const buildWallet = async (
  config: Config,
  rli: Interface,
  logger: Logger
): Promise<string | undefined> => {
  if (config instanceof StandaloneConfig) {
    return GENESIS_MINT_WALLET_SEED;
  }
  while (true) {
    const choice = await rli.question(WALLET_LOOP_QUESTION);
    switch (choice) {
      case "1":
        return toHex(randomBytes(32));
      case "2":
        return await rli.question("Enter your wallet seed: ");
      case "3":
        logger.info("Exiting...");
        return undefined;
      default:
        logger.error(`Invalid choice: ${choice}`);
    }
  }
};

// ---------------------------------------------------------------------
// Run function — coordinates the full app lifecycle
// ---------------------------------------------------------------------

export const run = async (
  config: Config,
  testEnv: TestEnvironment,
  logger: Logger
): Promise<void> => {
  const rli = createInterface({ input, output, terminal: true });
  const providersToBeStopped: MidnightWalletProvider[] = [];

  try {
    const envConfiguration = await testEnv.start();
    logger.info(`Environment started: ${JSON.stringify(envConfiguration)}`);

    const seed = await buildWallet(config, rli, logger);
    if (seed === undefined) return;

    const walletProvider = await MidnightWalletProvider.build(logger, envConfiguration, seed);
    providersToBeStopped.push(walletProvider);
    const walletFacade: WalletFacade = walletProvider.wallet;
    await walletProvider.start();

    const unshieldedState = await waitForUnshieldedFunds(
      logger,
      walletFacade,
      envConfiguration,
      unshieldedToken()
    );
    const nightBalance = unshieldedState.balances[unshieldedToken().raw];
    if (nightBalance === undefined) {
      logger.info("No funds received, exiting...");
      return;
    }
    logger.info(`Your NIGHT wallet balance is: ${nightBalance}`);

    if (config.generateDust) {
      const dustGeneration = await generateDust(logger, seed, unshieldedState, walletFacade);
      if (dustGeneration) {
        logger.info(`Submitted dust generation registration transaction: ${dustGeneration}`);
        await syncWallet(logger, walletFacade);
      }
    }

    // The ballot's admin/voter identity (secretKey) is deliberately
    // separate from the wallet's payment keys — same pattern as the
    // bulletin-board tutorial's private state. Generated fresh each run
    // for Wave 1; persisting/reusing this across sessions (so returning
    // as the same voter works after a restart) is a Wave 2 improvement —
    // right now BallotAPI.join() falls back to a random key if none is
    // stored, which is fine for a single demo session but won't let you
    // "resume" as the same voter identity across CLI restarts yet.
    const secretKey = randomBytes(32);

    const zkConfigProvider = new NodeZkConfigProvider<
      "addEligibleVoter" | "castVote" | "getTally"
    >(config.zkConfigPath);

    const providers: BallotProviders = {
      privateStateProvider: levelPrivateStateProvider<PrivateStateId, BallotPrivateState>({
        privateStateStoreName: config.privateStateStoreName,
        signingKeyStoreName: `${config.privateStateStoreName}-signing-keys`,
        privateStoragePasswordProvider: () => "ZkBallot-Wave1-2026!",
        accountId: seed,
      }),
      publicDataProvider: indexerPublicDataProvider(
        envConfiguration.indexer,
        envConfiguration.indexerWS
      ),
      zkConfigProvider,
      proofProvider: httpClientProofProvider(envConfiguration.proofServer, zkConfigProvider),
      walletProvider,
      midnightProvider: walletProvider,
    };

    await mainLoop(providers, secretKey, rli, logger);
  } catch (e) {
    logError(logger, e);
    logger.info("Exiting...");
  } finally {
    try {
      rli.close();
      rli.removeAllListeners();
    } catch (e) {
      logError(logger, e);
    } finally {
      try {
        for (const wallet of providersToBeStopped) {
          logger.info("Stopping wallet...");
          await wallet.stop();
        }
        if (testEnv) {
          logger.info("Stopping test environment...");
          await testEnv.shutdown();
        }
      } catch (e) {
        logError(logger, e);
      }
    }
  }
};

function logError(logger: Logger, e: unknown) {
  if (e instanceof Error) {
    logger.error(`Found error '${e.message}'`);
    logger.debug(`${e.stack}`);
  } else {
    logger.error("Found error (unknown type)");
  }
}
