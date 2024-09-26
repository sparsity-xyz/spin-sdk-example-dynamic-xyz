import {
    SpinGame,
    SpinOPZKProver,
    SpinOPZKProverInput,
    SpinOPZKProverOutput,
} from "@zkspin/lib";

import { DynamicWidget } from "@dynamic-labs/sdk-react-core";
import { useEffect, useState } from "react";
import "./App.css";
import { OPZK_GAME_ID, OPZK_OPERATOR_URL } from "./config";
import { Gameplay } from "./gameplay/gameplay";
import {
    getOnchainGameState,
    getPlayerNonce,
    getPlayerSignature,
} from "./web3";

interface GameState {
    total_steps: bigint;
    current_position: bigint;
}

/* This function is used to verify the proof on-chain */
async function submit_to_operator(
    submission: SpinOPZKProverOutput
): Promise<any> {
    const response = await fetch(`${OPZK_OPERATOR_URL}/submitTransaction`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        // Convert BigInt to string # https://stackoverflow.com/questions/65152373/typescript-serialize-bigint-in-json
        body: JSON.stringify(submission.data, (_, v) =>
            typeof v === "bigint" ? v.toString() : v
        ),
    }).catch(async (err) => {
        if (err.cause && err.cause.code == "ECONNRESET") {
            console.error("Failed to get nonce: ECONNRESET");
            // sleep for 1 second
            return new Promise((resolve) => setTimeout(resolve, 1000)).then(
                async () => await submit_to_operator(submission)
            );
        } else {
            console.log("Error");
            throw err;
        }
    });

    if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(
            `Failed to submit transaction: ${response.statusText} ${errorMessage}`
        );
    }
    return await response.json();
}

let spin: SpinGame<SpinOPZKProverInput, SpinOPZKProverOutput>;

function App() {
    useEffect(() => {
        let total_steps = BigInt(0);
        let current_position = BigInt(0);

        getOnchainGameState()
            .then(async (result): Promise<any> => {
                total_steps = result[0];
                current_position = result[1];
            })
            .catch((e) => {
                console.error("Failed to get on-chain game states", e);
                alert("Unable to connect to the chain, using default values.");
            })
            .finally(async () => {
                setOnChainGameStates({
                    total_steps,
                    current_position,
                });

                spin = new SpinGame({
                    gameplay: new Gameplay(),
                    gameplayProver: new SpinOPZKProver(
                        {
                            operator_url: OPZK_OPERATOR_URL,
                        },
                        getPlayerNonce,
                        getPlayerSignature
                    ),
                });

                await spin.newGame({
                    initialStates: [total_steps, current_position],
                });

                updateDisplay();
            });
    }, []);

    const [gameState, setGameState] = useState<GameState>({
        total_steps: BigInt(0),
        current_position: BigInt(0),
    });

    const [onChainGameStates, setOnChainGameStates] = useState<GameState>({
        total_steps: BigInt(0),
        current_position: BigInt(0),
    });

    const [moves, setMoves] = useState<bigint[]>([]);

    const onClick = (command: bigint) => () => {
        spin.step(command);
        updateDisplay();
    };

    const updateDisplay = () => {
        const newGameState = spin.getCurrentGameState();
        setGameState({
            total_steps: newGameState[0],
            current_position: newGameState[1],
        });
        setMoves(spin.playerInputs);
    };

    // Submit the proof to the cloud
    const submitProof = async () => {
        if (!spin) {
            console.error("spin not initialized");
            return;
        }

        const submission = await spin.generateSubmission({
            game_id: OPZK_GAME_ID,
            segments: [
                {
                    initial_states: [
                        onChainGameStates.total_steps,
                        onChainGameStates.current_position,
                    ],
                    player_action_inputs: moves,
                    final_state: [
                        gameState.total_steps,
                        gameState.current_position,
                    ],
                },
            ],
            uninitializedOnchainState: true,
        });

        console.log("submission = ", submission);

        const submissionResult = await submit_to_operator(submission);

        console.log("submissionResult = ", submissionResult);
    };

    return (
        <div className="App">
            <header className="App-header">
                <DynamicWidget></DynamicWidget>
                <header>GamePlay</header>
                <header>Number of Moves: {moves.length}</header>
                <header>
                    How to Play: this game let the player increase or decrease
                    the position. The position ranges from 0-10. It keeps track
                    of the total steps so far and current position. When
                    submitted on-chain, the progresses are updated and recorded
                    on-chain{" "}
                </header>
                <header>
                    Game State:{" "}
                    {JSON.stringify(gameState, (_, v) =>
                        typeof v === "bigint" ? v.toString() : v
                    )}
                </header>
                <header>
                    OnChain Game State:{" "}
                    {JSON.stringify(onChainGameStates, (_, v) =>
                        typeof v === "bigint" ? v.toString() : v
                    )}
                </header>
                <button onClick={onClick(BigInt(0))}>Decrement</button>
                <button onClick={onClick(BigInt(1))}>Increment</button>
            </header>
            <button onClick={submitProof}>Submit</button>
        </div>
    );
}

export default App;
