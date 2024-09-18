import React from "react";
import ReactDOM from "react-dom/client";
import {
    DynamicContextProvider,
    mergeNetworks,
} from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import App from "./App";
import "./index.css";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider } from "@tanstack/react-query";
import { config, queryClient } from "./web3";
import { DynamicWagmiConnector } from "@dynamic-labs/wagmi-connector";
import { myEvmNetworks } from "./web3";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <DynamicContextProvider
            settings={{
                environmentId: "71bd0b70-174b-4bfb-acfb-d39d846882ac",
                walletConnectors: [EthereumWalletConnectors],
                overrides: {
                    evmNetworks: (networks) =>
                        mergeNetworks(myEvmNetworks, networks),
                },
            }}
        >
            <WagmiProvider config={config}>
                <QueryClientProvider client={queryClient}>
                    <DynamicWagmiConnector>
                        <App />
                    </DynamicWagmiConnector>
                </QueryClientProvider>
            </WagmiProvider>
        </DynamicContextProvider>
    </React.StrictMode>
);
