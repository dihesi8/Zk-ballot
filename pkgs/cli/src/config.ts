// pkgs/cli/src/config.ts
//
// Network-specific configuration, adapted from Midnight's official
// bulletin-board CLI tutorial (docs.midnight.network/tutorials/bboard/
// bboard-cli-implementation) for the zk-ballot contract.

import path from "node:path";
import {
  EnvironmentConfiguration,
  getTestEnvironment,
  RemoteTestEnvironment,
  TestEnvironment,
} from "@midnight-ntwrk/testkit-js";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { Logger } from "pino";

export interface Config {
  readonly privateStateStoreName: string;
  readonly logDir: string;
  readonly zkConfigPath: string;
  getEnvironment(logger: Logger): TestEnvironment;
  readonly generateDust: boolean;
}

export const currentDir = path.resolve(
  new URL(import.meta.url).pathname,
  ".."
);

export class StandaloneConfig implements Config {
  getEnvironment(logger: Logger): TestEnvironment {
    return getTestEnvironment(logger) as TestEnvironment;
  }
  privateStateStoreName = "ballot-private-state";
  logDir = path.resolve(
    currentDir,
    "..",
    "logs",
    "standalone",
    `${new Date().toISOString()}.log`
  );
  zkConfigPath = path.resolve(
    currentDir,
    "..",
    "..",
    "contract",
    "src",
    "managed",
    "ballot"
  );
  generateDust = false;
}

export class PreprodRemoteConfig implements Config {
  getEnvironment(logger: Logger): TestEnvironment {
    setNetworkId("preprod");
    return new PreprodTestEnvironment(logger);
  }
  privateStateStoreName = "ballot-private-state";
  logDir = path.resolve(
    currentDir,
    "..",
    "logs",
    "preprod-remote",
    `${new Date().toISOString()}.log`
  );
  zkConfigPath = path.resolve(
    currentDir,
    "..",
    "..",
    "contract",
    "src",
    "managed",
    "ballot"
  );
  generateDust = true;
}

export class PreprodTestEnvironment extends RemoteTestEnvironment {
  constructor(logger: Logger) {
    super(logger);
  }
  private getProofServerUrl(): string {
    const container = this.proofServerContainer as
      | { getUrl(): string }
      | undefined;
    if (!container) {
      throw new Error("Proof server container is not available.");
    }
    return container.getUrl();
  }
  getEnvironmentConfiguration(): EnvironmentConfiguration {
    return {
      walletNetworkId: "preprod",
      networkId: "preprod",
      indexer: "https://indexer.preprod.midnight.network/api/v4/graphql",
      indexerWS:
        "wss://indexer.preprod.midnight.network/api/v4/graphql/ws",
      node: "https://rpc.preprod.midnight.network",
      nodeWS: "wss://rpc.preprod.midnight.network",
      faucet: "https://midnight-tmnight-preprod.nethermind.dev/",
      proofServer: this.getProofServerUrl(),
    };
  }
}

// NOTE: Preview network config omitted for Wave 1 — add a PreviewRemoteConfig
// + PreviewTestEnvironment pair (same shape as above, swap "preprod" for
// "preview" and the corresponding endpoints) if/when we need it.
