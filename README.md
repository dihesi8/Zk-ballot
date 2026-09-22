# ZK-Ballot

Private DAO voting on [Midnight](https://midnight.network). Prove you're
eligible to vote and haven't voted twice, without revealing who you are or
what you voted for.

Built for the [Midnight Buildathon](https://app.akindo.io/wave-hacks/jaMZjqPOBsLXvjdG?tab=overview) (Wave 1).

## Problem

Most organizations that run open voting, whether for investors, board
members, or internal team decisions, need strict verification of who is
allowed to vote. That verification usually happens in the open: a wallet
address, a KYC record, or a token balance is checked publicly, and the
resulting vote is tied to that identity for anyone in the room to see.

## Solution

ZK-Ballot uses zero-knowledge verification so a voter can prove they meet
the requirements to vote, such as holding a governance token, without
exposing the underlying document, wallet balance, or identity itself.
Combined with a nullifier-based voting scheme, it gives organizations a
fully anonymous voting system: eligibility is checked, double-voting is
prevented, and the tally is public, but no individual vote or voter
identity ever is.

## Why it matters

An open voting system can be compromised by the simple fact that it is
open. When a vote is visible to the room, people vote to match a manager,
a large stakeholder, or the group, rather than their honest judgment, and
favoritism becomes a tool rather than an accident. ZK-Ballot removes that
pressure: the process stays provably fair because eligibility and the
tally are verifiable, while no individual's choice or identity is ever
exposed.

ZK-Ballot separates *eligibility* and *choice* (private) from the
*outcome* (public), using Midnight's three execution contexts:

| Context | Where it runs | What it does |
|---|---|---|
| **Witness** | Off-chain, on the voter's device | Holds the voter's secret key and vote choice. Never leaves the client. |
| **Circuit** | Local ZK engine (Compact) | Proves "this voter is eligible" and "this voter hasn't voted yet" without revealing identity or choice. |
| **Ledger** | On-chain, public | Only sees a valid proof, the nullifier registry, and the updated public tally. No link between voter and vote. |

See [`pkgs/contract/src/ballot.compact`](./pkgs/contract/src/ballot.compact)
for the contract and inline comments explaining each piece.

## Target user

Mid-size DAOs and organizations currently running governance on
Snapshot, Tally, Discord polls, or a spreadsheet, who want a private
option for sensitive votes without giving up a verifiable tally.

## Go-to-market

- Pilot with one team or DAO currently running open voting who want a
  private option for a sensitive proposal.
- Publish an integration guide once the contract supports multiple
  proposals natively, so any team can deploy their own instance.
- List ZK-Ballot in the Midnight ecosystem directory once live on
  testnet.
- Offer the underlying commitment and nullifier pattern as a reusable
  Compact library (Wave 3), so other builders don't have to solve
  eligibility-without-identity from scratch.

## Roadmap

### Wave 1, current

- [x] Compiled Compact contract: eligibility check, nullifier, public
      tally (`addEligibleVoter`, `castVote`, `getTally`)
- [x] Real commitment and nullifier hashing running client side,
      matching the contract exactly
- [x] Working dashboard: admin and voter roles, multi-proposal voting,
      configurable demo requirements, anonymous feedback and replies
- [x] Landing page with an honest Built vs Planned tech stack breakdown
- [ ] Live testnet deployment and wallet connection, see Status below
- [ ] Demo video, slide deck, public community post

### Wave 2, planned

- [ ] Resolve the `@midnight-ntwrk/compact-js` typing blocker and wire
      up the real deploy and wallet flow (`pkgs/cli` is already built,
      just blocked on this)
- [ ] Extend `ballot.compact` to a `Map`-based ledger for real
      multi-proposal support on-chain
- [ ] Selective-disclosure audit portal: a voter can prove their own
      vote to an auditor with a private viewing key, without revealing
      it publicly
- [ ] Swap the frontend's local simulation for real `BallotAPI` calls

### Wave 3, planned

- [ ] Extract the eligibility and nullifier pattern into a reusable
      open-source Compact and TypeScript library for other Midnight
      builders
- [ ] Protocol fee or licensing model to sustain ongoing development

## Repo structure

```
pkgs/
  core/       Lightweight commitment/nullifier hashing, no heavy SDK deps
  contract/   Compact smart contract (ballot.compact) plus its TS bindings
  shared/     BallotAPI (deploy/join/call) for the real wallet flow, Wave 2, parked
  cli/        Interactive terminal client for the real wallet flow, Wave 2, parked
  app/        Next.js frontend: landing page at /, working dashboard at /app
```

`pkgs/shared` and `pkgs/cli` are intentionally left out of the root
workspace for now, since their dependencies hit an unresolved SDK typing
issue, see Status below and `CHANGELOG.md` for the full trail. Nothing is
deleted; they're standalone-installable (`cd pkgs/cli && npm install`)
whenever that work resumes.

## Status: Wave 1

**Contract, real, compiled, tested.** `ballot.compact` compiles cleanly
against `compactc` (3 circuits: `addEligibleVoter`, `castVote`,
`getTally`). Eligibility check, deterministic nullifier, and public tally
logic are all real, working circuit code, not mocked.

**Frontend, real cryptography, simulated ledger.** The Next.js app
(`pkgs/app`) runs the exact same commitment and nullifier hashing the
contract uses on-chain (via `@midnight-ntwrk/compact-runtime`'s
`persistentHash`, shared code in `pkgs/core/src/commitments.ts`), but the
eligibility set, nullifier set, and tally live in browser state rather
than on a deployed Midnight ledger. There is no live wallet connection or
proof generation yet. This is a deliberate Wave 1 scope decision, not an
oversight: the live deploy and wallet SDK wiring (`pkgs/cli`) hit a deep,
well-documented blocker in generic-type alignment between our generated
contract and `@midnight-ntwrk/compact-js`'s own type system. Full trail
in `CHANGELOG.md`.

**Features implemented (Wave 1 UI):**
- Admin: manually register voters by verification hash, set which demo
  requirements (token, KYC, NFT badge, or social proof, all
  self-confirmed, no real verification) gate voting, publish and close
  proposals, view the eligible-voter registry, view and reply to
  anonymous feedback.
- Voter: confirm requirements to reveal their own verification hash,
  paste it back in to unlock voting for the session, vote on active
  proposals, post anonymous feedback and questions, read the shared
  feedback thread including admin replies.
- Multi-proposal support at the simulation and frontend layer,
  nullifiers are already per-proposal cryptographically
  (`hash(secretKey, proposalId)`), so this works correctly without
  contract changes. The compiled contract itself still handles a single
  proposal; extending it to a `Map`-based multi-proposal ledger is
  scoped as Wave 2 work.
- Closed proposals get a real hash-based "result digest"
  (`computeResultDigest`), a genuine cryptographic checksum binding the
  proposal id and final tally together, framed honestly as a results
  checksum, not a new zero-knowledge proof.
- Deliberate privacy-preserving UI choice: the admin's voter registry
  shows *who is eligible*, never *who has voted*. Nullifiers are
  intentionally unlinkable to voter identity, so that distinction is
  surfaced in the UI as the actual privacy guarantee, not left out as a
  missing feature.

**CLI, parked, not abandoned.** `pkgs/cli` has a real wallet provider,
DUST generation, and an interactive menu already built out; it is
blocked on the typing issue above, not deleted. The Wave 2 goal is to
resolve that blocker and swap the frontend's simulation calls for real
`BallotAPI` calls. The two already share the same underlying logic
(`pkgs/core`), so the swap is a call-site change, not a rewrite.

## Environment and toolchain

```
compactc 0.30.0   # required exactly — newer compactc emits a language
                  # version that fails this contract's pragma check
node >= 20
```

Install the Compact compiler and pin the version:

```
compact update 0.30.0
compact list   # confirm 0.30.0 is active
```

## Setup

```
npm install
npm run contract   # compiles pkgs/contract/src/ballot.compact via compactc
npm run dev:app    # runs the Next.js app: landing page at /, dashboard at /app
```

`npm run build` builds `pkgs/core`, `pkgs/contract`, and `pkgs/app` in
order.

### Resuming Wave 2 CLI work

`pkgs/shared` and `pkgs/cli` are standalone projects for now (see Repo
structure above):

```
cd pkgs/shared && npm install
cd pkgs/cli && npm install
```

Once the `compact-js` typing blocker is resolved, install [Lace
Wallet](https://www.lace.io/), switch to the **PreProd** network, fund it
from the [PreProd faucet](https://faucet.preprod.midnight.network/), run
the proof server (`docker compose -f pkgs/cli/proof-server.yml up`), and
deploy with `npm run preprod` from inside `pkgs/cli`.

## License

Apache 2.0, see [LICENSE](./LICENSE). Submitted under the `midnightntwrk`
tag per Buildathon open-source requirements.
#
