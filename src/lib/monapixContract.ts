
import { useReadContract } from 'wagmi';
import { monadTestnet } from 'wagmi/chains';
import abi from '@/contracts/monapix.json';
import { simulateContract, writeContract } from '@wagmi/core'
import { wagmiConfig } from '@/App';

// Contract address - validate format
const CONTRACT_ADDRESS = '0x937ed3aEda60E22D87a1899b2E9623feCe218bdA';
if (!/^0x[a-fA-F0-9]{40}$/.test(CONTRACT_ADDRESS)) {
  throw new Error('Invalid contract address format');
}

export const MONAPIX_CONTRACT_ADDRESS = CONTRACT_ADDRESS;

// Contract config for wagmi
export const monapixContractConfig = {
    address: MONAPIX_CONTRACT_ADDRESS as `0x${string}`,
    abi,
    chainId: monadTestnet.id,
} as const;

// Input validation functions
function validateCoordinates(x: number, y: number): boolean {
  return Number.isInteger(x) && Number.isInteger(y) && 
         x >= 0 && x <= 255 && y >= 0 && y <= 255;
}

function validateLockedDays(lockedDays: bigint): boolean {
  return lockedDays >= 1n && lockedDays <= 7n;
}

function validateValue(value: bigint): boolean {
  return value > 0n && value <= 1000000000000000000000n; // Max 1000 ETH
}

function validateTokenId(tokenId: bigint): boolean {
  return tokenId >= 0n && tokenId <= 255999n;
}

// --- Read Hooks ---

export function useTotalSupply() {
    return useReadContract({
        ...monapixContractConfig,
        functionName: 'totalSupply',
    });
}

export function usePixelPrice() {
    return useReadContract({
        ...monapixContractConfig,
        functionName: 'pixelPrice',
    });
}

export function useLockBonus() {
    return useReadContract({
        ...monapixContractConfig,
        functionName: 'lockBonus',
    });
}

export function useOwnerOf(tokenId: bigint) {
    if (!validateTokenId(tokenId)) {
        throw new Error('Invalid token ID');
    }
    
    return useReadContract({
        ...monapixContractConfig,
        functionName: 'ownerOf',
        args: [tokenId],
    });
}

export function useGetRemainingLockTime(tokenId: bigint) {
    if (!validateTokenId(tokenId)) {
        throw new Error('Invalid token ID');
    }
    
    return useReadContract({
        ...monapixContractConfig,
        functionName: 'getRemainingLockTime',
        args: [tokenId],
    });
}

export function useIsInLockdown(x: number, y: number) {
    if (!validateCoordinates(x, y)) {
        throw new Error('Invalid coordinates');
    }
    
    return useReadContract({
        ...monapixContractConfig,
        functionName: 'isInLockdown',
        args: [x, y],
    });
}

// --- Write Functions ---

export async function mintPixel(x: number, y: number, lockedDays: bigint, value: bigint) {
    // Validate all inputs
    if (!validateCoordinates(x, y)) {
        throw new Error('Invalid coordinates: x and y must be integers between 0 and 255');
    }
    
    if (!validateLockedDays(lockedDays)) {
        throw new Error('Invalid locked days: must be between 1 and 7');
    }
    
    if (!validateValue(value)) {
        throw new Error('Invalid value: must be positive and reasonable');
    }

    try {
        const { request } = await simulateContract(wagmiConfig, {
            abi,
            address: MONAPIX_CONTRACT_ADDRESS as `0x${string}`,
            functionName: 'mintPixel',
            args: [x, y, lockedDays],
            value
        });
        
        return writeContract(wagmiConfig, request);
    } catch (error) {
        console.error('Error simulating mint pixel contract:', error);
        throw new Error('Failed to mint pixel. Please check your inputs and try again.');
    }
}

export async function purchasePixel(x: number, y: number, lockedDays: bigint, value: bigint) {
    // Validate all inputs
    if (!validateCoordinates(x, y)) {
        throw new Error('Invalid coordinates: x and y must be integers between 0 and 255');
    }
    
    if (!validateLockedDays(lockedDays)) {
        throw new Error('Invalid locked days: must be between 1 and 7');
    }
    
    if (!validateValue(value)) {
        throw new Error('Invalid value: must be positive and reasonable');
    }

    try {
        const { request } = await simulateContract(wagmiConfig, {
            abi,
            address: MONAPIX_CONTRACT_ADDRESS as `0x${string}`,
            functionName: 'purchasePixel',
            args: [x, y, lockedDays],
            value
        });
        
        return writeContract(wagmiConfig, request);
    } catch (error) {
        console.error('Error simulating purchase pixel contract:', error);
        throw new Error('Failed to purchase pixel. Please check your inputs and try again.');
    }
}
