import { ethers } from "ethers";
import { createConfig } from "wagmi";
import { QueryClient } from "@tanstack/react-query";
import { createClient, http } from "viem";
import { getOrMapViemChain } from "@dynamic-labs/ethereum-core";
import { getAccount, readContract, signMessage } from "wagmi/actions";
import { SpinOPZKGameContractABI, getOnchainStatesWagmi } from "@zkspin/lib";
import { GAME_CONTRACT_ADDRESS, OPZK_GAME_ID } from "./config";

export const queryClient = new QueryClient();

export const myEvmNetworks = [
    {
        blockExplorerUrls: [""], // replace me
        chainId: 31337,
        name: "Hardhat",
        rpcUrls: ["http://127.0.0.1:8545/"],
        iconUrls: [""], // replace me
        nativeCurrency: {
            name: "Ethereum",
            symbol: "ETH",
            decimals: 18,
        },
        networkId: 31337,
    },
];

export const getPlayerNonce = async () => {
    const player_address = getAccount(config).address;

    if (!player_address) {
        console.error("player address not found");
        throw new Error("player address not found");
    }

    const player_nonce: bigint = await readContract(config, {
        abi: SpinOPZKGameContractABI.abi,
        address: GAME_CONTRACT_ADDRESS,
        functionName: "getSubmissionNonce",
        args: [player_address],
    });

    return player_nonce;
};

export const getPlayerSignature = async (submissionHash: string) => {
    const player_address = getAccount(config).address;

    if (!player_address) {
        console.error("player address not found");
        throw new Error("player address not found");
    }

    const player_signature = await signMessage(config, {
        message: {
            raw: ethers.getBytes(submissionHash),
        },
    });

    return { player_address, player_signature };
};

export const getOnchainGameState = async () => {
    return getOnchainStatesWagmi(
        getAccount(config).address!,
        GAME_CONTRACT_ADDRESS,
        OPZK_GAME_ID,
        2,
        readContract,
        config
    );
};

export const config = createConfig({
    chains: [getOrMapViemChain(myEvmNetworks[0])],
    // multiInjectedProviderDiscovery: false,
    client({ chain }) {
        return createClient({
            chain,
            transport: http(),
        });
    },
});
