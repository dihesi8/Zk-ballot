// pkgs/shared/src/commitments.ts
//
// Re-export shim. The real implementation moved to @zk-ballot/core so
// pkgs/app can depend on the lightweight commitment-hashing logic without
// pulling in pkgs/shared's heavy deploy/wallet SDK dependencies (which hit
// an unresolvable transitive @midnight-ntwrk/ledger-v9 alpha version — see
// CHANGELOG.md). Kept as a re-export, not deleted, so pkgs/cli's existing
// imports (`from "./commitments.js"`, `from "@zk-ballot/shared"`) keep
// working unchanged.
export * from "@zk-ballot/core";
