import { createConfig } from "wagmi";
import { QueryClient } from "@tanstack/react-query";
import { createClient, http } from "viem";
import { getOrMapViemChain } from "@dynamic-labs/ethereum-core";

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
