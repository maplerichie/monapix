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
};

// --- Read Hooks ---

export function useTotalSupply(options = {}) {
    return useReadContract({
        ...monapixContractConfig,
        functionName: 'totalSupply',
        ...options,
    });
}

export function usePixelPrice(options = {}) {
    return useReadContract({
        ...monapixContractConfig,
        functionName: 'pixelPrice',
        ...options,
    });
}

export function useLockBonus(options = {}) {
    return useReadContract({
        ...monapixContractConfig,
        functionName: 'lockBonus',
        ...options,
    });
}

export function useOwnerOf(tokenId: bigint, options = {}) {
    return useReadContract({
        ...monapixContractConfig,
        functionName: 'ownerOf',
        args: [tokenId],
        ...options,
    });
}

export function useGetRemainingLockTime(tokenId: bigint, options = {}) {
    return useReadContract({
        ...monapixContractConfig,
        functionName: 'getRemainingLockTime',
        args: [tokenId],
        ...options,
    });
}

export function useIsInLockdown(x: number, y: number, options = {}) {
    return useReadContract({
        ...monapixContractConfig,
        functionName: 'isInLockdown',
        args: [x, y],
        ...options,
    });
}

// --- Write Hooks ---

export function useMintPixel(x: number, y: number, lockedDays: bigint, value: bigint) {

    return writeContract(wagmiConfig, {
        ...monapixContractConfig,
        functionName: 'mintPixel',
        args: [x, y, lockedDays],
        value
    });
}

export function usePurchasePixel(x: number, y: number, lockedDays: bigint, value: bigint) {
    return writeContract(wagmiConfig, {
        ...monapixContractConfig,
        functionName: 'purchasePixel',
        args: [x, y, lockedDays],
        value,
    });
}
