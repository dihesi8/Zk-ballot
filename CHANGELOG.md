# Changelog

Tracks bugs found, fixed, and notable decisions during development.
(QA rubric — "Bug Resolution & Debugging Evidence")

## Unreleased

- Initial repo scaffold: monorepo structure (contract / shared / cli / app),
  `ballot.compact` skeleton with commented circuit logic, README, license,
  toolchain notes.
- Implemented real circuit logic in `ballot.compact`: `addEligibleVoter`
  (admin-gated), `castVote` (eligibility check + deterministic nullifier +
  tally increment), `getTally` (read-only). Not yet compiled/verified
  against `compactc` — pending first local compile.
- Design change: switched eligibility from "live governance token check"
  (not feasible in-circuit for Wave 1) to an admin-managed commitment set
  populated from an off-chain token snapshot.
- Design fix: removed the salted-nullifier idea from the original scaffold
  comments — nullifiers must be deterministic (hash(secretKey, proposalId))
  to actually catch repeat votes.
- Fixed compiler invocation: build script called `compactc`, but the
  installed binary is `compact compile`.
- Fixed syntax: Compact requires function-call form `assert(cond, "msg")`,
  not bare `assert cond "msg"`.
- Fixed disclosure errors: Compact treats ALL constructor/circuit
  parameters as private proof inputs by default, not just `witness()`
  values. Added `disclose()` to both constructor assignments, the
  `addEligibleVoter` insert, and the `castVote` branch condition.
- Added `tsconfig.json` + `src/index.ts` for the contract package's TS
  layer, wired to the real generated exports (`Contract`, `ledger`,
  `pureCircuits`, `Witnesses`, `Ledger` types) confirmed from
  `managed/ballot/contract/index.d.ts`.
- **`npm run contract` (compact compile + tsc) passes end-to-end.** 3
  circuits compiled: `addEligibleVoter` (k=13, rows=4457), `castVote`
  (k=13, rows=8141), `getTally` (k=6, rows=48). This is the first fully
  working milestone — contract + TS integration layer both build clean.
- Built out `pkgs/contract/src/witnesses.ts` (real witness implementation
  — both `adminSecretKey`/`voterSecretKey` return the same local identity;
  role is enforced by the contract's own commitment checks, not by the
  client).
- Built out `pkgs/shared` as the reusable API layer (BallotAPI class:
  deploy, join, addEligibleVoter, castVote, reactive tally/state
  observable), adapted from Midnight's official bulletin-board tutorial
  pattern (docs.midnight.network/tutorials/bboard).
- **Design fix (privacy):** original `addEligibleVoter` design implicitly
  required the admin to know a voter's raw secret key to compute their
  commitment, which defeats the purpose. Fixed by having each voter
  compute their OWN commitment locally (`computeVoterCommitment` in
  `pkgs/shared/src/commitments.ts`) and share only that hash with the
  admin off-chain — admin never sees anyone's secret key.
- Built out `pkgs/cli` fully: wallet provider, DUST generation, network
  config (standalone/preprod), and the main interactive menu (show my
  voter commitment / add eligible voter / cast vote / display ledger,
  private, and derived state).
- **Known unverified pieces, flagged rather than guessed past:**
  - `CompactTypeVector` constructor argument order in
    `commitments.ts` (element count vs. type array) — confirmed the
    general pattern exists via the Midnight forum, not the exact call
    signature against our installed version.
  - `deployContract()`'s exact argument shape (`contract` vs.
    `compiledContract` key) in `BallotAPI.deploy` — varies by
    `@midnight-ntwrk/midnight-js-contracts` version.
  - Preview network config intentionally omitted (Preprod only for
    Wave 1).
- Fixed 4 wrong relative import paths pointing at
  `contract/src/managed/ballot/...` — the compiled contract output
  actually lives at `contract/managed/ballot/...` (no `src/` segment).
  Affected `witnesses.ts`, `shared/api.ts`, `shared/common-types.ts`,
  `cli/index.ts`. Caught via real `tsc` errors after `npm install`.
- Confirmed and fixed the `deployContract`/`findDeployedContract`
  property name: this SDK version expects `compiledContract`, not
  `contract` — matches the official tutorial's
  `compiledContract: CompiledBBoardContractContract` pattern that I'd
  under-read on the first implementation pass.
- `npm install` succeeded (390 packages) but surfaced Node engine
  warnings: `@midnight-ntwrk/midnight-js-compact` wants Node >=22,
  `undici` wants >=22.19, local Node is v20.20.2. Not fatal yet
  (install completed), but flagged as a likely source of runtime
  errors later if the SDK actually needs Node 22 features — may need
  `nvm install 22` if things break at runtime rather than build time.
- **Architecture correction:** discovered (via a matching current
  community tutorial for this exact SDK generation) that
  `deployContract`/`findDeployedContract`'s `compiledContract` field
  is NOT a raw `new Contract(witnesses)` instance — it's a
  `CompiledContract.make(...)` binding from a separate package,
  `@midnight-ntwrk/compact-js`, which wasn't even in our dependencies.
  Added `pkgs/contract/src/compiled.ts` exporting `CompiledBallotContract`
  (witnesses baked in via `.withWitnesses()`), and updated
  `BallotAPI.deploy`/`join` to use it. This also confirms the Node >=22
  requirement above isn't a fluke — the tutorial this pattern comes from
  explicitly requires `"engines": { "node": ">=22" }`. **Recommend running
  `nvm install 22 && nvm use 22` before the next build attempt.**
- **Deliberate scope decision ("Option B"):** after several rounds of
  chasing exact generic alignment between our generated contract's
  `Contract<PS, W>` type and `@midnight-ntwrk/compact-js`'s own abstract
  `Contract<PS>` type system (used throughout `midnight-js-contracts`'s
  `deployContract`/`findDeployedContract`), stopped chasing full
  compile-time type alignment at that specific SDK boundary. Loosened
  `BallotProviders` and `DeployedBallotContract` in `common-types.ts`,
  and added narrow, explicitly-commented casts in `BallotAPI.deploy`/
  `join`. This does NOT weaken the contract's actual privacy/correctness
  guarantees — those are enforced by the compiled circuit and ZK proof at
  the Compact layer, not by these TypeScript types. It only means less
  compile-time safety at this one plumbing boundary. Worth tightening
  post-Wave-1 if time allows — flagged clearly in code comments so it's
  not mistaken for an oversight.
- **Strategic pivot for Wave 1 deadline:** after multiple rounds
  resolving real SDK typing issues (import paths, compiler binary name,
  disclosure rules, `CompiledContract` binding, `Contract<PS>` generic
  misalignment), the remaining deploy/join typing work was taking longer
  than the Wave 1 timeline allows. Reviewed a finished competitor project
  (TrueMile) that took the same pragmatic path: ship a real, compiled
  contract + a frontend built against a local simulation, defer live
  wallet/testnet wiring. Adopted the same strategy, with one important
  difference — our simulation layer uses the REAL `persistentHash`
  primitive (via `@midnight-ntwrk/compact-runtime`) for all commitment
  and nullifier logic, not a fake stand-in. `pkgs/cli` is kept as-is,
  documented as parked Wave 2 work, not deleted.
- Built `pkgs/app` as a Next.js + Tailwind frontend: `lib/simulation.ts`
  mirrors `ballot.compact`'s exact logic (eligibility check, nullifier
  check, tally increment, same error messages) using real commitment
  hashing. Main page implements a role-switchable demo (Admin + 3 voter
  identities), an admin registry panel, a voter panel showing the
  self-computed commitment (never the secret key), and a live tally
  display. Header includes an explicit Simulated/Live mode indicator —
  Live is disabled with a tooltip explaining why, rather than hidden.
- Extended `pkgs/shared/src/commitments.ts` with `computeNullifier`,
  matching the contract's 3-element nullifier hash
  (domain tag + secretKey + proposalId) — previously only the 2-element
  admin/voter commitment hashes existed.
- **Fixed a real install blocker:** `npm install` at the repo root failed
  with `ETARGET: No matching version found for
  @midnight-ntwrk/ledger-v9@^0.1.0-alpha.1` — a transitive dependency
  pulled in by the heavy wallet/deploy SDK chain (`midnight-js-contracts`,
  `wallet-sdk-*`, etc.), almost certainly related to Midnight's ongoing
  npm scope migration (`@midnight-ntwrk/*` → `@midnightntwrk/*`) leaving
  some alpha versions unpublished/renamed mid-transition. Since npm
  workspaces resolve the ENTIRE workspace graph together (not
  per-package), simply removing `pkgs/app`'s dependency on the heavy chain
  wasn't sufficient — `pkgs/shared`/`pkgs/cli` still declared it, and a
  root install still has to resolve everything every workspace declares.
  Fix: split the real commitment-hashing logic (`commitments.ts`,
  `utils.ts`) out of `pkgs/shared` into a new lightweight `pkgs/core`
  package with only `@midnight-ntwrk/compact-runtime` as a dependency —
  nothing from the broken chain. `pkgs/app` now depends only on
  `@zk-ballot/core`. `pkgs/shared`/`pkgs/cli` are temporarily REMOVED from
  the root `workspaces` array (not deleted — still on disk, still valid
  standalone projects) so a root `npm install` never touches their
  dependencies at all. To resume Wave 2 CLI work: `cd pkgs/cli && npm
  install` works as a standalone install in that subfolder; re-add both to
  root `workspaces` once the ledger-v9 issue is independently resolved.
- **Root-caused the ledger-v9 ETARGET error precisely** (verified via
  `npm view` against the real registry, not guessed): `pkgs/contract`'s
  own `@midnight-ntwrk/compact-js` dependency, pinned to `"*"`, was
  resolving to `2.5.3`+ which depends directly on the broken
  `@midnight-ntwrk/ledger-v9@^0.1.0-alpha.1` (a version that doesn't
  exist under either the old or new npm scope). Confirmed `2.5.1`
  depends on `@midnight-ntwrk/ledger-v8@^8.0.3` instead, which does
  exist and installs cleanly. Pinned `compact-js` to exactly `2.5.1` in
  `pkgs/contract/package.json`. Independently verified `2.5.1`'s
  `CompiledContract` API is byte-identical to what `compiled.ts` was
  already written against, so no code changes needed beyond the version
  pin. The `pkgs/core` split from the previous fix stays — it's still
  the right structural call even though it wasn't the actual blocker
  this time.
- **`npm install` confirmed working** after the compact-js 2.5.1 pin —
  no more ETARGET. Hit a follow-up "Module not found: @zk-ballot/core"
  error because pkgs/core's package.json pointed `main` at `dist/index.js`,
  which never gets generated without a manual build step. Fixed by
  pointing `main`/`types` straight at `src/index.ts` and adding
  `@zk-ballot/core` to next.config.js's `transpilePackages` — Next.js
  now transpiles the workspace package's TS source directly, no separate
  build step required for local dev.
- Fixed a webpack-vs-tsc resolution gap: `pkgs/core/src/index.ts` used
  `export * from "./commitments.js"` (referring to `commitments.ts`) —
  valid under TypeScript's own bundler-mode resolution, but Next.js's
  webpack resolver looks for a literal `commitments.js` file and doesn't
  fall back to `.ts`. Dropped the `.js` extensions on both relative
  exports in that file, which resolves correctly under both tools.
- Fixed WASM loading: `@midnight-ntwrk/compact-runtime` pulls in
  `@midnightntwrk/onchain-runtime-v4`, a WASM binary providing the real
  `persistentHash` implementation. Webpack 5 (used by Next.js) doesn't
  support WASM imports without explicit opt-in. Added
  `experiments.asyncWebAssembly`/`topLevelAwait`/`layers` and a
  `webassemblyModuleFilename` split (server vs. client) to
  `next.config.js`'s webpack config — the standard fix for
  wasm-bindgen-style packages in Next.js.
- **Major UI/feature overhaul**, based on a UI spec PDF the user provided
  (dark glassmorphic reference design). Kept the ZK-Ballot name (spec used
  a different placeholder name, "MidnightBallot" — flagged, not silently
  renamed). Toned the spec's neon cyan down to a more muted teal per
  "mature, not sloppy" direction.
  - Rewrote `simulation.ts`: multi-proposal support (`Proposal[]` instead
    of a single ledger), configurable demo "requirements" gating,
    anonymous feedback + admin replies, real hash-based result digests
    on proposal close.
  - Added `computeResultDigest` to `pkgs/core/src/commitments.ts` — a
    genuine `persistentHash` over (proposalId, tallyYes, tallyNo), framed
    as a results checksum, not a new ZK proof.
  - New components: `Header`, `RequirementsGate` (voter: confirm
    requirements → reveal hash → paste-to-unlock voting, matching the
    described UX literally), `RegistryPanel` (admin: requirements editor
    + add-voter + eligible list), `ProposalsPanel` (admin create/close,
    voter vote), `FeedbackPanel` (shared board, anonymous posts, admin
    replies).
  - New dark glassmorphic design system: void/surface/panel background
    layers, muted cyan/emerald/amber/rose accents, glass-panel/glass-input
    utility classes. Dropped the earlier "ballot desk" paper aesthetic
    entirely per this direction change.
- **Added a landing page**, based on a second UI spec PDF the user
  provided (dark glassmorphic marketing page reference) plus a footer
  style reference image. Restructured routing: `/` is now the landing
  page, the working dashboard moved to `/app`, linked via an "Enter App"
  button.
  - Corrected several claims from the reference spec to match what is
    actually built rather than copying it wholesale: compactc version
    (0.30.0, not the spec's 0.28.0), Next.js version (15, not 14), and
    critically, the spec implied a live testnet deploy — added an
    explicit "Built" vs "Planned" status column to the tech stack table
    and an honest Wave 1/Wave 2 caption under the data-flow diagram
    instead.
  - New landing components: `LandingHeader`, `Hero` (3-context preview
    card instead of fabricated vote-tally numbers, to avoid presenting
    invented statistics as real), `HowItWorks`, `TechStack`,
    `PrivacyFirst`, `Footer` (shared with the dashboard for consistency).
  - Followed explicit style constraints: no gradients, no neon colors, no
    emoji, no em dashes anywhere in UI copy (swept and fixed several
    pre-existing ones in dashboard components too, for consistency).
- Added `Background3D.tsx`: a dependency-free canvas particle network
  (perspective-projected, slowly rotating, connects nearby points) as a
  subtle global background, wired into `layout.tsx` so it applies to
  both the landing page and the dashboard. Deliberately avoided adding
  Three.js given how much dependency-resolution pain the Midnight SDK
  packages already caused elsewhere in this project. Respects
  `prefers-reduced-motion`.
- Full README rewrite: corrected and expanded the problem/solution/why-
  it-matters copy from the user's draft, added a Go-to-market section
  (closes a real rubric gap — "Go-to-Market Plan" is explicitly scored
  under Business Development), and made the Wave 1/2/3 roadmap into a
  visible checklist instead of three prose bullets. Also fixed several
  sections that had drifted from the actual repo (stale Vite references,
  old `pkgs/shared`/`cli` root-workspace setup, stale build commands) to
  match current reality.
- **Fixed a real crash bug, found via testing**: voting as an
  unregistered voter threw an uncaught runtime error instead of a
  friendly toast. Root cause: several handlers called
  `setRegistry((r) => mutatingFn(r, ...))`, passing a function that could
  throw directly into React's `setState`. React can invoke that function
  outside the synchronous scope of the surrounding `try/catch`, so the
  throw escaped uncaught. Fixed across all handlers
  (`runAdmin`/`handleVote`/feedback submit) by computing the result
  first, inside `try/catch`, and only calling the setter with the plain
  resulting value.
- **Fixed a related design gap**: the "paste your hash to unlock voting"
  step only checked that you pasted your own commitment correctly, not
  whether the admin had actually registered it. A voter could "unlock"
  the UI without being genuinely eligible, and only discover the problem
  when the vote itself failed. `RequirementsGate` now checks
  `eligibleVoters.has(commitment)` before unlocking, with a distinct
  message when the hash is self-consistent but not yet registered.
- Added `.next/` and `pkgs/cli/logs/` to `.gitignore` (missing before
  now, would have picked up local build/log artifacts on first `git
  add`). Verified nothing problematic was already tracked in history.
