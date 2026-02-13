import { createWalletClient, http, parseEther, formatEther } from "viem";
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    console.log("Starting deployment of DisasterCertificate contract...\n");

    // Load environment variables
    let privateKey = process.env.SEPOLIA_PRIVATE_KEY;
    const rpcUrl = process.env.SEPOLIA_RPC_URL;

    // Ensure private key has 0x prefix
    if (privateKey && !privateKey.startsWith("0x")) {
        privateKey = `0x${privateKey}`;
    }

    if (!privateKey) {
        throw new Error(
            "SEPOLIA_PRIVATE_KEY not found in environment variables",
        );
    }
    if (!rpcUrl) {
        throw new Error("SEPOLIA_RPC_URL not found in environment variables");
    }

    // Create account from private key
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    console.log(`Deploying from account: ${account.address}`);

    // Create wallet client
    const walletClient = createWalletClient({
        account,
        chain: sepolia,
        transport: http(rpcUrl),
    });

    // Get the compiled contract
    const contractPath = path.join(
        __dirname,
        "../artifacts/contracts/DistasterCertificate.sol/DisasterCertificate.json",
    );

    if (!fs.existsSync(contractPath)) {
        throw new Error(
            "Contract not compiled. Run 'npx hardhat compile' first.",
        );
    }

    const contractJson = JSON.parse(fs.readFileSync(contractPath, "utf8"));
    const bytecode = contractJson.bytecode as `0x${string}`;
    const abi = contractJson.abi;

    console.log("Deploying contract...");

    // Deploy the contract
    const hash = await walletClient.deployContract({
        abi,
        bytecode,
        args: [],
    });

    console.log(`Transaction hash: ${hash}`);
    console.log("Waiting for confirmation...\n");

    // Wait for transaction receipt
    const publicClient = await import("viem").then((m) =>
        m.createPublicClient({
            chain: sepolia,
            transport: http(rpcUrl),
        }),
    );

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (!receipt.contractAddress) {
        throw new Error("Contract deployment failed - no contract address");
    }

    console.log("✅ Contract deployed successfully!");
    console.log(`Contract address: ${receipt.contractAddress}`);
    console.log(`Block number: ${receipt.blockNumber}`);
    console.log(`Gas used: ${receipt.gasUsed}`);

    // Get network name
    const networkName = "sepolia";

    // Prepare deployment data
    const deploymentData = {
        contractName: "DisasterCertificate",
        contractAddress: receipt.contractAddress,
        deployer: account.address,
        network: networkName,
        chainId: sepolia.id,
        transactionHash: hash,
        blockNumber: receipt.blockNumber.toString(),
        gasUsed: receipt.gasUsed.toString(),
        deployedAt: new Date().toISOString(),
        abi: abi,
    };

    // Save deployment details
    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const deploymentFile = path.join(deploymentsDir, `${networkName}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentData, null, 2));

    console.log(`\n📄 Deployment details saved to: ${deploymentFile}`);

    // Also save a master deployments file
    const allDeploymentsFile = path.join(__dirname, "../deployments.json");
    let allDeployments: any = {};

    if (fs.existsSync(allDeploymentsFile)) {
        allDeployments = JSON.parse(
            fs.readFileSync(allDeploymentsFile, "utf8"),
        );
    }

    allDeployments[networkName] = {
        contractName: "DisasterCertificate",
        contractAddress: receipt.contractAddress,
        deployer: account.address,
        transactionHash: hash,
        blockNumber: receipt.blockNumber.toString(),
        deployedAt: deploymentData.deployedAt,
    };

    fs.writeFileSync(
        allDeploymentsFile,
        JSON.stringify(allDeployments, null, 2),
    );
    console.log(`📄 Summary saved to: ${allDeploymentsFile}`);

    console.log("\n🎉 Deployment complete!");
    console.log(
        `\nView on Etherscan: https://sepolia.etherscan.io/address/${receipt.contractAddress}`,
    );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Deployment failed:", error);
        process.exit(1);
    });
