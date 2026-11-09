# Metaverse Hospitality NFT Contract

An ERC-721A NFT contract for a hospitality-themed collection, written for a client. It supports a staged sale with Merkle-proof allowlists and owner-controlled reveal.

## Features

- **Gas-efficient batch minting** via ERC-721A, with a 7,882-token cap.
- **Four mint paths:** a reserved team allocation (per-address reservations), free mint, allowlist mint, and public mint. Each phase has its own on/off switch and limits (per-wallet claim caps for free and allowlist, per-transaction cap for public).
- **Merkle-proof allowlists** for the free and allowlist phases, updatable by the owner.
- **Delayed reveal** with a placeholder URI until `setIsRevealed`.
- **Cumulative staking** tracked per token.
- **Safety:** `ReentrancyGuard` on every mint, exact-payment checks, mints from contracts blocked, owner-only configuration.

## Run it

```bash
npm install
cp .env.example .env
npx hardhat compile
npx hardhat test
```

## Stack

Solidity 0.8 · Hardhat · TypeScript · ERC-721A · OpenZeppelin

---

<sub>Built by [Davin Harding](https://davin.io) · More at [github.com/davinharding](https://github.com/davinharding)</sub>
