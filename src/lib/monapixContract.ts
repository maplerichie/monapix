
import { useReadContract } from 'wagmi';
import { monadTestnet } from 'wagmi/chains';
import abi from '@/contracts/monapix.json';
import { writeContract } from '@wagmi/core'
import { wagmiConfig } from '@/App';

// Contract address
export const MONAPIX_CONTRACT_ADDRESS = '0x595d87691AAdC64Ae62861a60C4766860Ec2C4ec';

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
    return writeContract(wagmiConfig, {
        ...monapixContractConfig,
        functionName: 'mintPixel',
        args: [x, y, lockedDays],
        value
    });
}

export async function purchasePixel(x: number, y: number, lockedDays: bigint, value: bigint) {
    return writeContract(wagmiConfig, {
        ...monapixContractConfig,
        functionName: 'purchasePixel',
        args: [x, y, lockedDays],
        value,
    });
}
