import { Wallet, JsonRpcProvider } from "ethers";
import dotenv from "dotenv";

dotenv.config();

// Use a testnet provider - replace with actual GRC-20 network RPC
const provider = new JsonRpcProvider("https://rpc-testnet.grc-20.thegraph.com");

// Wallet setup - will be configured via .env
export const wallet = process.env.PRIVATE_KEY 
  ? new Wallet(process.env.PRIVATE_KEY, provider)
  : null;

if (!wallet) {
  console.error("No wallet configured. Set PRIVATE_KEY in .env file.");
  process.exit(1);
}
