// pkgs/shared/src/commitments.ts
//
// Reproduces ballot.compact's commitment scheme client-side, so a user can
// compute their own admin/voter commitment locally WITHOUT ever sharing
// their secret key with anyone else.
//
// Contract logic being mirrored:
//   persistentHash<Vector<2, Bytes<32>>>([pad(32, "<domain tag>"), sk])
//
// Confirmed against @midnight-ntwrk/compact-runtime's public API
// (persistentHash<a>(rt_type: CompactType<a>, value: a): Uint8Array, and
// CompactTypeVector / CompactTypeBytes as the runtime type descriptors —
// see forum.midnight.network/t/hashing-in-compact-on-the-client-side-using-
// persistenthash/61 for the confirmed pattern).
//
// FLAG: the exact CompactTypeVector constructor signature (element count
// first vs. an array of per-element types) wasn't independently confirmed
// beyond that forum thread's example. If `compact-runtime`'s installed
// version rejects `new CompactTypeVector(2, bytes32Type)`, that
// constructor call is the first thing to check — paste the error and
// we'll adjust.

import {
  persistentHash,
  CompactTypeBytes,
  CompactTypeVector,
} from "@midnight-ntwrk/compact-runtime";

const bytes32Type = new CompactTypeBytes(32);
const twoBytes32VectorType = new CompactTypeVector(2, bytes32Type);
const threeBytes32VectorType = new CompactTypeVector(3, bytes32Type);

export const ADMIN_DOMAIN_TAG = "zk-ballot:admin:v1";
export const VOTER_DOMAIN_TAG = "zk-ballot:voter:v1";
export const NULLIFIER_DOMAIN_TAG = "zk-ballot:nullifier:v1";

/**
 * Compact's `pad(32, "...")` — right-pads a UTF-8 string into a 32-byte
 * buffer. Throws if the tag is too long to fit, matching how `pad` would
 * behave at compile time.
 */
const padDomainTag = (tag: string): Uint8Array => {
  const encoded = new TextEncoder().encode(tag);
  if (encoded.length > 32) {
    throw new Error(`domain tag too long for pad(32, ...): "${tag}"`);
  }
  const bytes = new Uint8Array(32);
  bytes.set(encoded);
  return bytes;
};

/**
 * Computes persistentHash([pad(32, domainTag), secretKey]) — identical to
 * what ballot.compact computes on-chain for a given domain tag + secret
 * key. Used to derive:
 *   - the admin's public commitment (passed as the constructor's adminPk
 *     argument at deploy time)
 *   - a voter's own commitment (computed locally by the voter, then shared
 *     with the admin off-chain so the admin can call addEligibleVoter —
 *     the admin never sees the voter's secret key, only this hash)
 */
export const computeCommitment = (
  domainTag: string,
  secretKey: Uint8Array
): Uint8Array => {
  return persistentHash(twoBytes32VectorType, [
    padDomainTag(domainTag),
    secretKey,
  ]);
};

export const computeAdminCommitment = (secretKey: Uint8Array): Uint8Array =>
  computeCommitment(ADMIN_DOMAIN_TAG, secretKey);

export const computeVoterCommitment = (secretKey: Uint8Array): Uint8Array =>
  computeCommitment(VOTER_DOMAIN_TAG, secretKey);

/**
 * Computes persistentHash([pad(32, "zk-ballot:nullifier:v1"), secretKey,
 * proposalId]) — identical to castVote's on-chain nullifier derivation.
 * Deterministic per (secretKey, proposalId) pair, which is the whole point:
 * the same voter attempting to vote twice on the same proposal produces the
 * same nullifier both times, so it gets caught — without revealing which
 * voter it was.
 */
export const computeNullifier = (
  secretKey: Uint8Array,
  proposalId: Uint8Array
): Uint8Array => {
  const encodedTag = new TextEncoder().encode(NULLIFIER_DOMAIN_TAG);
  if (encodedTag.length > 32) {
    throw new Error("nullifier domain tag too long");
  }
  const paddedTag = new Uint8Array(32);
  paddedTag.set(encodedTag);
  return persistentHash(threeBytes32VectorType, [
    paddedTag,
    secretKey,
    proposalId,
  ]);
};

const RESULT_DOMAIN_TAG = "zk-ballot:result:v1";

const numberToBytes32 = (n: number): Uint8Array => {
  const bytes = new Uint8Array(32);
  const view = new DataView(bytes.buffer);
  view.setBigUint64(24, BigInt(Math.max(0, Math.trunc(n))), false);
  return bytes;
};

/**
 * A real hash (persistentHash, same primitive as everything above) binding
 * a closed proposal's id and final tally together. This is a results
 * checksum/summary digest — a real cryptographic commitment to "this exact
 * result", useful for detecting if a published result was tampered with —
 * NOT a new zero-knowledge proof. Framed honestly as a checksum, not
 * oversold.
 */
export const computeResultDigest = (
  proposalId: Uint8Array,
  tallyYes: number,
  tallyNo: number
): Uint8Array => {
  const encodedTag = new TextEncoder().encode(RESULT_DOMAIN_TAG);
  const paddedTag = new Uint8Array(32);
  paddedTag.set(encodedTag);
  return persistentHash(new CompactTypeVector(4, bytes32Type), [
    paddedTag,
    proposalId,
    numberToBytes32(tallyYes),
    numberToBytes32(tallyNo),
  ]);
};
