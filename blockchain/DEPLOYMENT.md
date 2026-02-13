# DisasterCertificate Smart Contract Deployment Guide

## Prerequisites

1. Node.js and pnpm installed
2. `.env` file configured with:
    - `SEPOLIA_RPC_URL`: Your Infura or Alchemy Sepolia RPC URL
    - `SEPOLIA_PRIVATE_KEY`: Your deployer wallet private key (without 0x prefix)

## Installation

```bash
pnpm install
```

## Compile Contract

```bash
pnpm compile
```

## Deploy to Sepolia

```bash
pnpm deploy:sepolia
```

## Deployment Process

The deployment script will:

1. ✅ Compile the DisasterCertificate contract
2. ✅ Deploy to Sepolia testnet
3. ✅ Wait for transaction confirmation
4. ✅ Save deployment details to two files:
    - `deployments/sepolia.json` - Full deployment data with ABI
    - `deployments.json` - Summary of all deployments

## Deployment Files

### `deployments/sepolia.json`

Contains complete deployment information:

- Contract address
- Deployer address
- Transaction hash
- Block number
- Gas used
- Full ABI
- Timestamp

### `deployments.json`

Contains summary of all network deployments for quick reference.

## After Deployment

1. View your contract on Etherscan (link provided in output)
2. Verify the contract (optional):
    ```bash
    npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
    ```
3. Use the contract address from the deployment files in your backend/frontend

## Contract Features

- **ERC-721 NFT**: Each certificate is a unique NFT
- **Teacher Authorization**: Owner can authorize teachers to issue certificates
- **Certificate Issuance**: Teachers can issue certificates to students (min score: 70)
- **IPFS Storage**: Certificate metadata stored on IPFS
- **Revocation**: Certificates can be revoked by teachers
- **Verification**: Anyone can verify certificate validity

## Example Usage

After deployment, you can interact with the contract:

```typescript
// Authorize a teacher
await contract.authorizeTeacher("0xTeacherAddress");

// Issue a certificate
await contract.issueCertificate(
    "John Doe",
    "john@example.com",
    85,
    "QmHash...",
);

// Verify a certificate
const [isValid, cert] = await contract.verifyCertificate(tokenId);
```
