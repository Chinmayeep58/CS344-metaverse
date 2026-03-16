import axios from "axios";
import FormData from "form-data";

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;

if (!PINATA_API_KEY || !PINATA_SECRET_API_KEY) {
    throw new Error(
        "Missing required environment variables: PINATA_API_KEY or PINATA_SECRET_API_KEY",
    );
}

const PINATA_PIN_FILE_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS";
const PINATA_PIN_JSON_URL = "https://api.pinata.cloud/pinning/pinJSONToIPFS";

interface PinataResponse {
    IpfsHash: string;
    PinSize: number;
    Timestamp: string;
}

interface MetadataObject {
    [key: string]: any;
}

export const uploadFileToIPFS = async (
    fileBuffer: Buffer,
    fileName: string,
): Promise<string> => {
    try {
        const formData = new FormData();
        formData.append("file", fileBuffer, fileName);

        const metadata = JSON.stringify({
            name: fileName,
        });
        formData.append("pinataMetadata", metadata);

        const options = JSON.stringify({
            cidVersion: 1,
        });
        formData.append("pinataOptions", options);

        const response = await axios.post<PinataResponse>(
            PINATA_PIN_FILE_URL,
            formData,
            {
                maxBodyLength: Infinity,
                headers: {
                    "Content-Type": `multipart/form-data; boundary=${formData.getBoundary()}`,
                    pinata_api_key: PINATA_API_KEY!,
                    pinata_secret_api_key: PINATA_SECRET_API_KEY!,
                },
            },
        );

        return response.data.IpfsHash;
    } catch (error: any) {
        console.error("Error uploading file to IPFS:", error);
        throw new Error(
            `Failed to upload file to IPFS: ${
                error.response?.data?.error || error.message || error
            }`,
        );
    }
};


export const uploadMetadataToIPFS = async (
    metadataObject: MetadataObject,
): Promise<string> => {
    try {
        const response = await axios.post<PinataResponse>(
            PINATA_PIN_JSON_URL,
            {
                pinataContent: metadataObject,
                pinataMetadata: {
                    name: `metadata-${Date.now()}.json`,
                },
                pinataOptions: {
                    cidVersion: 1,
                },
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    pinata_api_key: PINATA_API_KEY!,
                    pinata_secret_api_key: PINATA_SECRET_API_KEY!,
                },
            },
        );

        return response.data.IpfsHash;
    } catch (error: any) {
        console.error("Error uploading metadata to IPFS:", error);
        throw new Error(
            `Failed to upload metadata to IPFS: ${
                error.response?.data?.error || error.message || error
            }`,
        );
    }
};


export const getIPFSGatewayURL = (ipfsHash: string): string => {
    return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
};


export const testPinataConnection = async (): Promise<boolean> => {
    try {
        const response = await axios.get(
            "https://api.pinata.cloud/data/testAuthentication",
            {
                headers: {
                    pinata_api_key: PINATA_API_KEY!,
                    pinata_secret_api_key: PINATA_SECRET_API_KEY!,
                },
            },
        );
        console.log("Pinata connection successful:", response.data);
        return true;
    } catch (error: any) {
        console.error("Pinata connection failed:", error);
        return false;
    }
};

export default {
    uploadFileToIPFS,
    uploadMetadataToIPFS,
    getIPFSGatewayURL,
    testPinataConnection,
};
