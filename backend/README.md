# VR Disaster Training Metaverse - Backend

## Prerequisites

-   Node.js v18+
-   PostgreSQL database (Aiven Cloud)
-   Sepolia testnet RPC URL (Infura)
-   Pinata API keys for IPFS
-   Deployed smart contract on Sepolia

## Installation

```bash
npm install
```

## Environment Setup

Create a `.env` file with the following variables:

```env
# Database
DB_NAME=your_database
DB_HOST=your_host
DB_PORT=22360
DB_USER=your_user
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_secret
JWT_EXPIRES_IN=1d

# Blockchain
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_API_KEY
PRIVATE_KEY=your_private_key
CONTRACT_ADDRESS=0x4ae404489cb792f52af2b86752559f4d3c3b4a70

# IPFS
PINATA_API_KEY=your_api_key
PINATA_SECRET_API_KEY=your_secret_key
```

## Running the Server

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

## Running Tests

### Prerequisites for Testing

1. Make sure the server is running on port 3000
2. Ensure you have enough Sepolia ETH in your wallet
3. Check that all environment variables are set

### Run Integration Tests

```bash
# In one terminal, start the server
npm run dev

# In another terminal, run tests
npm test
```

### Test Coverage

The integration test covers:

1. ✅ Health check
2. ✅ User authentication (signup/login)
3. ✅ Profile retrieval
4. ✅ Student creation
5. ✅ Student retrieval
6. ✅ Teacher's students list
7. ✅ Certificate issuance (blockchain transaction)
8. ✅ Certificate retrieval from database
9. ✅ Certificate verification on blockchain
10. ✅ Student's certificates list

### Expected Output

```
<userPrompt>
Provide the fully rewritten file, incorporating the suggested code change. You must produce the complete file.
</userPrompt>

```
