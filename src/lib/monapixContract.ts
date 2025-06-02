import { createPublicClient, http, WriteContractParameters } from 'viem';
import { sonic } from 'viem/chains';
import { writeContract } from 'wagmi/actions';
import { Abi } from 'viem';
import { config } from '@/integrations/wagmi/config';

const INFURA_API_KEY = process.env.NEXT_PUBLIC_INFURA_API_KEY;

export const publicClient = createPublicClient({
  chain: sonic,
  transport: http(`https://sonic-rpc.scroll.io/l2`, {
    fetchOptions: {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  }),
});

export const CONTRACT_ADDRESS = '0x949D79746C5248581039739E21934018d108F287' as `0x${string}`;

export const MONAPIX_ABI: Abi = [
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "pixelId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      }
    ],
    "name": "mintPixel",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "pixelId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      }
    ],
    "name": "purchasePixel",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "pixels",
    "outputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "color",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "image_url",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "link",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "unlocked_at",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const mintPixel = async (x: number, y: number, price: bigint) => {
  const pixelId = BigInt(x * 256 + y);
  
  return writeContract(config, {
    address: CONTRACT_ADDRESS,
    abi: MONAPIX_ABI,
    functionName: 'mintPixel',
    args: [pixelId, price],
    value: price,
    chainId: 10143,
    chain: sonic,
    account: '0x0000000000000000000000000000000000000000' as `0x${string}` // This will be overridden by wagmi
  });
};

export const purchasePixel = async (pixelId: number, price: bigint) => {
  return writeContract(config, {
    address: CONTRACT_ADDRESS,
    abi: MONAPIX_ABI,
    functionName: 'purchasePixel',
    args: [BigInt(pixelId), price],
    value: price,
    chainId: 10143,
    chain: sonic,
    account: '0x0000000000000000000000000000000000000000' as `0x${string}` // This will be overridden by wagmi
  });
};

export const getPixelData = async (pixelId: number) => {
  try {
    const data = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: MONAPIX_ABI,
      functionName: 'pixels',
      args: [BigInt(pixelId)],
    });

    return data;
  } catch (error) {
    console.error("Error fetching pixel data:", error);
    return null;
  }
};
