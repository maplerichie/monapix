
import { useReadContract } from 'wagmi';
import { monadTestnet } from 'wagmi/chains';
import abi from '@/contracts/monapix.json';
import { simulateContract, writeContract } from '@wagmi/core'
import { wagmiConfig } from '@/App';

// Contract address
export const MONAPIX_CONTRACT_ADDRESS = '0x937ed3aEda60E22D87a1899b2E9623feCe218bdA';

// Contract config for wagmi
export const monapixContractConfig = {
    address: MONAPIX_CONTRACT_ADDRESS as `0x${string}`,
    abi,
    chainId: monadTestnet.id,
} as const;

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
    return useReadContract({
        ...monapixContractConfig,
        functionName: 'ownerOf',
        args: [tokenId],
    });
}

export function useGetRemainingLockTime(tokenId: bigint) {
    return useReadContract({
        ...monapixContractConfig,
        functionName: 'getRemainingLockTime',
        args: [tokenId],
    });
}

export function useIsInLockdown(x: number, y: number) {
    return useReadContract({
        ...monapixContractConfig,
        functionName: 'isInLockdown',
        args: [x, y],
    });
}

// --- Write Functions ---

export async function mintPixel(x: number, y: number, lockedDays: bigint, value: bigint) {
    const { request } = await simulateContract(wagmiConfig, {
        abi,
        address: MONAPIX_CONTRACT_ADDRESS as `0x${string}`,
        functionName: 'mintPixel',
        args: [x, y, lockedDays],
        value
    })
    return writeContract(wagmiConfig, request);
}

export async function purchasePixel(x: number, y: number, lockedDays: bigint, value: bigint) {
    const { request } = await simulateContract(wagmiConfig, {
        abi,
        address: MONAPIX_CONTRACT_ADDRESS as `0x${string}`,
        functionName: 'purchasePixel',
        args: [x, y, lockedDays],
        value
    })
    return writeContract(wagmiConfig, request);
}
