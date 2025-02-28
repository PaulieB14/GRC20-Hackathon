import { createPublicClient, http } from 'viem';
import 'dotenv/config';

// Define the GRC-20 Testnet chain configuration
const grc20Testnet = {
  id: 19411,
  name: 'Geogenesis Testnet',
  network: 'geogenesis-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['https://rpc-geo-test-zc16z3tcvf.t.conduit.xyz/'] },
    public: { http: ['https://rpc-geo-test-zc16z3tcvf.t.conduit.xyz/'] },
  }
};

/**
 * Fetches the latest accepted edit CID for a given space
 * @param spaceId The ID of the space to check for accepted edits
 * @returns The CID of the latest accepted edit, or null if none found
 */
export async function getLatestAcceptedEdit(spaceId: string): Promise<string | null> {
  try {
    console.log(`[Governance] Fetching latest accepted edit for space: ${spaceId}`);
    
    // Create a public client to interact with the GRC-20 network
    const publicClient = createPublicClient({
      chain: grc20Testnet,
      transport: http()
    });

    // Query the API for the latest accepted edits
    const response = await fetch(`https://api-testnet.grc-20.thegraph.com/space/${spaceId}/edits`, {
      method: "GET",
      headers: { "Accept": "application/json" }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch edits: ${response.statusText}\n${errorText}`);
    }

    const edits = await response.json();
    
    // Filter for accepted edits and sort by timestamp (newest first)
    const acceptedEdits = edits
      .filter((edit: any) => edit.status === 'ACCEPTED')
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (acceptedEdits.length === 0) {
      console.log('[Governance] No accepted edits found');
      return null;
    }

    // Return the CID of the latest accepted edit
    const latestCid = acceptedEdits[0].cid;
    console.log(`[Governance] Latest accepted edit CID: ${latestCid}`);
    return latestCid;
  } catch (error) {
    console.error('[Governance] Error fetching latest accepted edit:', error);
    throw error;
  }
}

/**
 * Creates a governance edit to mark a CID as accepted
 * @param spaceId The ID of the space
 * @param cid The CID to mark as accepted
 * @param author The wallet address of the author
 * @returns The CID of the governance edit
 */
export async function createGovernanceAcceptEdit(
  spaceId: string, 
  cid: string, 
  author: string
): Promise<string> {
  try {
    console.log(`[Governance] Creating governance accept edit for CID: ${cid}`);
    
    // Create the governance edit
    const edit = {
      name: "Governance Accept Edit",
      author: author,
      description: `Governance acceptance of edit with CID: ${cid}`,
      ops: [
        {
          type: "SET_TRIPLE",
          triple: {
            entity: spaceId,
            attribute: "acceptedEdit",
            value: { type: "TEXT", value: cid }
          }
        }
      ]
    };

    // Convert to JSON
    const editJson = JSON.stringify(edit, null, 2);
    
    return editJson;
  } catch (error) {
    console.error('[Governance] Error creating governance accept edit:', error);
    throw error;
  }
}
